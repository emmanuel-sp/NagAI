package com.nagai.backend.digests;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.DigestAlreadyExistsException;
import com.nagai.backend.exceptions.DigestNotFoundException;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@Service
public class DigestService {

    private final DigestRepository digestRepository;
    private final UserService userService;

    public DigestService(DigestRepository digestRepository, UserService userService) {
        this.digestRepository = digestRepository;
        this.userService = userService;
    }

    public Digest getDigest() {
        User user = userService.getCurrentUser();
        return digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
    }

    public Digest createDigest(DigestAddRequest request) {
        User user = userService.getCurrentUser();
        if (digestRepository.existsByUserId(user.getUserId())) {
            throw new DigestAlreadyExistsException();
        }
        Digest digest = new Digest();
        digest.setUserId(user.getUserId());
        digest.setUnsubscribeToken(UUID.randomUUID().toString());
        applyFields(digest, request.getName(), request.getDescription(),
                request.getFrequency(), request.getDeliveryTime(), request.getContentTypes());
        if (digest.isActive()) {
            initializeNextDelivery(digest, user);
        }
        return digestRepository.save(digest);
    }

    public Digest updateDigest(DigestUpdateRequest request) {
        User user = userService.getCurrentUser();
        Digest digest = digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
        String oldFrequency = digest.getFrequency();
        String oldDeliveryTime = digest.getDeliveryTime();
        applyFields(digest, request.getName(), request.getDescription(),
                request.getFrequency(), request.getDeliveryTime(), request.getContentTypes());
        if (digest.isActive() && (!oldFrequency.equals(digest.getFrequency())
                || !oldDeliveryTime.equals(digest.getDeliveryTime()))) {
            initializeNextDelivery(digest, user);
        }
        return digestRepository.save(digest);
    }

    public Digest toggleDigest() {
        User user = userService.getCurrentUser();
        Digest digest = digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
        digest.setActive(!digest.isActive());
        if (digest.isActive()) {
            initializeNextDelivery(digest, user);
        } else {
            digest.setNextDeliveryAt(null);
        }
        return digestRepository.save(digest);
    }

    public void unsubscribeByToken(String token) {
        Digest digest = digestRepository.findByUnsubscribeToken(token)
                .orElseThrow(DigestNotFoundException::new);
        digest.setActive(false);
        digest.setNextDeliveryAt(null);
        digestRepository.save(digest);
    }

    public void deleteDigest() {
        User user = userService.getCurrentUser();
        Digest digest = digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
        digestRepository.delete(digest);
    }

    public void markDelivered(Digest digest, User user) {
        digest.setLastDeliveredAt(LocalDateTime.now(ZoneOffset.UTC));
        ZoneId zone = resolveZone(user.getTimezone());
        digest.setNextDeliveryAt(calculateNextDelivery(digest.getFrequency(), digest.getDeliveryTime(), zone));
        digestRepository.save(digest);
    }

    void initializeNextDelivery(Digest digest, User user) {
        ZoneId zone = resolveZone(user.getTimezone());
        digest.setNextDeliveryAt(calculateNextDelivery(digest.getFrequency(), digest.getDeliveryTime(), zone));
    }

    LocalDateTime calculateNextDelivery(String frequency, String deliveryTime, ZoneId zone) {
        int hour = mapDeliveryHour(deliveryTime);
        ZonedDateTime nowInZone = ZonedDateTime.now(zone);
        LocalDate baseDate = nowInZone.toLocalDate();
        LocalTime targetTime = LocalTime.of(hour, 0);

        // If today's target time has already passed, start from tomorrow
        if (nowInZone.toLocalTime().isAfter(targetTime)) {
            baseDate = baseDate.plusDays(1);
        }

        LocalDate nextDate = switch (frequency) {
            case "daily" -> baseDate;
            case "weekly" -> baseDate.plusDays(7);
            case "biweekly" -> baseDate.plusDays(14);
            case "monthly" -> baseDate.plusMonths(1);
            default -> baseDate.plusDays(1);
        };

        ZonedDateTime nextInZone = ZonedDateTime.of(nextDate, targetTime, zone);
        return nextInZone.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    static int mapDeliveryHour(String deliveryTime) {
        return switch (deliveryTime) {
            case "morning" -> 8;
            case "afternoon" -> 13;
            case "evening" -> 19;
            default -> 8;
        };
    }

    static ZoneId resolveZone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return ZoneOffset.UTC;
        }
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return ZoneOffset.UTC;
        }
    }

    private void applyFields(Digest digest, String name, String description,
                              String frequency, String deliveryTime, String[] contentTypes) {
        digest.setName(name);
        digest.setDescription(description);
        digest.setFrequency(frequency);
        digest.setDeliveryTime(deliveryTime);
        digest.setContentTypes(contentTypes);
    }
}
