package com.nagai.backend.calendar;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
public class GoogleCalendarService {

    private static final Logger log = LoggerFactory.getLogger(GoogleCalendarService.class);
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    private static final String REVOKE_URL = "https://oauth2.googleapis.com/revoke";
    private static final String OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String STATE_KEY_PREFIX = "calendar_oauth_state:";
    private static final long STATE_TTL_MINUTES = 10;

    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${google.client-id}")
    private String clientId;

    @Value("${google.client-secret:}")
    private String clientSecret;

    @Value("${google.calendar.redirect-uri:http://localhost:8080/auth/calendar/callback}")
    private String redirectUri;

    public GoogleCalendarService(UserRepository userRepository, StringRedisTemplate redisTemplate,
                                 RestTemplate externalRestTemplate) {
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
        this.restTemplate = externalRestTemplate;
    }

    public record BusyBlock(String startTime, String endTime, String summary) {}

    // ---- OAuth flow ----

    public String buildAuthorizationUrl(Long userId) {
        String state = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                STATE_KEY_PREFIX + state,
                String.valueOf(userId),
                STATE_TTL_MINUTES,
                TimeUnit.MINUTES);

        return UriComponentsBuilder.fromUriString(OAUTH_AUTHORIZE_URL)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "https://www.googleapis.com/auth/calendar.readonly")
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", state)
                .build().toUriString();
    }

    public Long resolveState(String state) {
        String key = STATE_KEY_PREFIX + state;
        String userIdStr = redisTemplate.opsForValue().get(key);
        if (userIdStr == null) return null;
        redisTemplate.delete(key);
        return Long.parseLong(userIdStr);
    }

    public void exchangeCodeForTokens(String code, User user) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(TOKEN_URL, params, Map.class);
            if (response == null) throw new IllegalStateException("Empty response from token endpoint");

            String accessToken = (String) response.get("access_token");
            String refreshToken = (String) response.get("refresh_token");
            Integer expiresIn = (Integer) response.get("expires_in");

            user.setGoogleCalendarAccessToken(accessToken);
            if (refreshToken != null) {
                user.setGoogleCalendarRefreshToken(refreshToken);
            }
            if (expiresIn != null) {
                user.setGoogleCalendarTokenExpiry(
                        LocalDateTime.now().plusSeconds(expiresIn));
            }
            userRepository.save(user);
        } catch (Exception e) {
            log.error("Failed to exchange calendar auth code for user={}: {}", user.getUserId(), e.getMessage());
            throw new RuntimeException("Failed to connect Google Calendar", e);
        }
    }

    public void disconnectCalendar(User user) {
        String token = user.getGoogleCalendarAccessToken() != null
                ? user.getGoogleCalendarAccessToken()
                : user.getGoogleCalendarRefreshToken();

        if (token != null) {
            try {
                restTemplate.postForObject(REVOKE_URL + "?token=" + token, null, Void.class);
            } catch (Exception e) {
                log.warn("Failed to revoke calendar token for user={}: {}", user.getUserId(), e.getMessage());
            }
        }

        user.setGoogleCalendarRefreshToken(null);
        user.setGoogleCalendarAccessToken(null);
        user.setGoogleCalendarTokenExpiry(null);
        userRepository.save(user);
    }

    // ---- Calendar event fetch ----

    public List<BusyBlock> fetchTodayEvents(User user, ZoneId zone) {
        String accessToken = getValidAccessToken(user);
        if (accessToken == null) return List.of();

        LocalDate today = LocalDate.now(zone);
        ZonedDateTime startOfDay = today.atStartOfDay(zone);
        ZonedDateTime endOfDay = today.atTime(LocalTime.MAX).atZone(zone);

        DateTimeFormatter iso = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
        String timeMin = iso.format(startOfDay);
        String timeMax = iso.format(endOfDay);

        String url = UriComponentsBuilder.fromUriString(CALENDAR_EVENTS_URL)
                .queryParam("timeMin", timeMin)
                .queryParam("timeMax", timeMax)
                .queryParam("singleEvents", "true")
                .queryParam("orderBy", "startTime")
                .queryParam("maxResults", "20")
                .build().toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            return parseEvents(response.getBody(), zone);
        } catch (HttpClientErrorException.Unauthorized e) {
            // Access token expired — refresh and retry once
            log.debug("Calendar access token expired for user={}, refreshing", user.getUserId());
            String refreshed = refreshAccessToken(user);
            if (refreshed == null) return List.of();
            headers.setBearerAuth(refreshed);
            request = new HttpEntity<>(headers);
            try {
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
                return parseEvents(response.getBody(), zone);
            } catch (Exception ex) {
                log.warn("Calendar fetch failed after token refresh for user={}: {}", user.getUserId(), ex.getMessage());
                return List.of();
            }
        } catch (Exception e) {
            log.warn("Calendar fetch failed for user={}: {}", user.getUserId(), e.getMessage());
            return List.of();
        }
    }

    // ---- Private helpers ----

    private String getValidAccessToken(User user) {
        LocalDateTime expiry = user.getGoogleCalendarTokenExpiry();
        boolean needsRefresh = expiry == null
                || LocalDateTime.now().isAfter(expiry.minusMinutes(2));

        if (!needsRefresh && user.getGoogleCalendarAccessToken() != null) {
            return user.getGoogleCalendarAccessToken();
        }
        return refreshAccessToken(user);
    }

    private String refreshAccessToken(User user) {
        String refreshToken = user.getGoogleCalendarRefreshToken();
        if (refreshToken == null) return null;

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("refresh_token", refreshToken);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(TOKEN_URL, params, Map.class);
            if (response == null) return null;

            String newAccessToken = (String) response.get("access_token");
            Integer expiresIn = (Integer) response.get("expires_in");
            // Google may rotate the refresh token
            String newRefreshToken = (String) response.get("refresh_token");

            user.setGoogleCalendarAccessToken(newAccessToken);
            if (expiresIn != null) {
                user.setGoogleCalendarTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn));
            }
            if (newRefreshToken != null) {
                user.setGoogleCalendarRefreshToken(newRefreshToken);
            }
            userRepository.save(user);
            return newAccessToken;
        } catch (HttpClientErrorException e) {
            log.warn("Calendar refresh token revoked for user={}, disconnecting", user.getUserId());
            // Token revoked — clear all calendar fields
            user.setGoogleCalendarRefreshToken(null);
            user.setGoogleCalendarAccessToken(null);
            user.setGoogleCalendarTokenExpiry(null);
            userRepository.save(user);
            return null;
        } catch (Exception e) {
            log.warn("Failed to refresh calendar access token for user={}: {}", user.getUserId(), e.getMessage());
            return null;
        }
    }

    private List<BusyBlock> parseEvents(String json, ZoneId zone) {
        List<BusyBlock> blocks = new ArrayList<>();
        if (json == null || json.isBlank()) return blocks;

        try {
            JsonNode root = mapper.readTree(json);
            JsonNode items = root.path("items");
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

            for (JsonNode item : items) {
                // Skip declined events
                JsonNode attendees = item.path("attendees");
                boolean declined = false;
                for (JsonNode attendee : attendees) {
                    if (attendee.path("self").asBoolean(false)
                            && "declined".equals(attendee.path("responseStatus").asText())) {
                        declined = true;
                        break;
                    }
                }
                if (declined) continue;

                String summary = item.path("summary").asText("");
                JsonNode start = item.path("start");
                JsonNode end = item.path("end");

                String startStr;
                String endStr;

                if (!start.path("dateTime").isMissingNode()) {
                    // Timed event
                    ZonedDateTime startDt = ZonedDateTime.parse(start.path("dateTime").asText())
                            .withZoneSameInstant(zone);
                    ZonedDateTime endDt = ZonedDateTime.parse(end.path("dateTime").asText())
                            .withZoneSameInstant(zone);
                    startStr = timeFmt.format(startDt);
                    endStr = timeFmt.format(endDt);
                } else {
                    // All-day event — mark as occupying the full day
                    startStr = "00:00";
                    endStr = "23:59";
                }

                blocks.add(new BusyBlock(startStr, endStr, summary));
            }
        } catch (Exception e) {
            log.warn("Failed to parse calendar events JSON: {}", e.getMessage());
        }

        return blocks;
    }
}
