package com.nagai.backend.calendar;

import java.io.IOException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;
import com.nagai.backend.users.UserService;

import jakarta.servlet.http.HttpServletResponse;

@RestController
public class CalendarController {

    private static final Logger log = LoggerFactory.getLogger(CalendarController.class);

    private final GoogleCalendarService googleCalendarService;
    private final UserService userService;
    private final UserRepository userRepository;

    @Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    public CalendarController(
            GoogleCalendarService googleCalendarService,
            UserService userService,
            UserRepository userRepository) {
        this.googleCalendarService = googleCalendarService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /**
     * Returns the Google OAuth URL the frontend should redirect the user to.
     * Requires authentication — the state parameter is tied to the current user.
     */
    @GetMapping("/calendar/auth-url")
    public ResponseEntity<Map<String, String>> getAuthUrl() {
        User user = userService.getCurrentUser();
        String url = googleCalendarService.buildAuthorizationUrl(user.getUserId());
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Google redirects here after the user grants (or denies) calendar access.
     * Public endpoint under /auth/** — user identity is carried in the state param.
     */
    @GetMapping("/auth/calendar/callback")
    public void calendarCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpServletResponse response) throws IOException {

        if (error != null || code == null || state == null) {
            log.warn("Calendar OAuth callback error: {}", error);
            response.sendRedirect(appBaseUrl + "/today?calendar=error");
            return;
        }

        Long userId = googleCalendarService.resolveState(state);
        if (userId == null) {
            log.warn("Calendar OAuth callback: invalid or expired state");
            response.sendRedirect(appBaseUrl + "/today?calendar=error");
            return;
        }

        userRepository.findById(userId).ifPresentOrElse(user -> {
            try {
                googleCalendarService.exchangeCodeForTokens(code, user);
                log.info("Google Calendar connected for user={}", userId);
            } catch (Exception e) {
                log.error("Calendar token exchange failed for user={}: {}", userId, e.getMessage());
            }
        }, () -> log.warn("Calendar callback: user={} not found", userId));

        response.sendRedirect(appBaseUrl + "/today?calendar=connected");
    }

    /**
     * Disconnects Google Calendar — clears tokens and revokes access on Google's side.
     */
    @DeleteMapping("/calendar/disconnect")
    public ResponseEntity<Void> disconnect() {
        User user = userService.getCurrentUser();
        googleCalendarService.disconnectCalendar(user);
        log.info("Google Calendar disconnected for user={}", user.getUserId());
        return ResponseEntity.noContent().build();
    }
}
