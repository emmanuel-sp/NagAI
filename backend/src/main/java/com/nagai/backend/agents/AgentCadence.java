package com.nagai.backend.agents;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class AgentCadence {

    public static final String PAUSE_REASON_STALE_PROGRESS = "stale_progress";
    public static final Duration DEPLOY_EMAIL_COOLDOWN = Duration.ofHours(24);

    private static final Map<String, Long> BASE_INTERVALS = Map.of(
            "nag", 6L,
            "motivation", 24L,
            "guidance", 48L);

    private static final Map<String, List<Long>> STALE_BACKOFF_LADDERS = Map.of(
            "nag", List.of(6L, 12L, 24L, 48L, 96L, 168L),
            "motivation", List.of(24L, 48L, 96L, 168L),
            "guidance", List.of(48L, 96L, 168L));

    private static final Map<String, Integer> STALE_PAUSE_THRESHOLDS = Map.of(
            "nag", 10,
            "motivation", 8,
            "guidance", 7);

    private AgentCadence() {}

    public static long baseIntervalHours(String messageType) {
        return BASE_INTERVALS.getOrDefault(messageType, 24L);
    }

    public static long acceleratedIntervalHours(String messageType) {
        long baseHours = baseIntervalHours(messageType);
        return Math.max(2L, baseHours / 2L);
    }

    public static long staleIntervalHours(String messageType, int staleCount) {
        List<Long> ladder = STALE_BACKOFF_LADDERS.getOrDefault(messageType, List.of(24L, 48L, 96L, 168L));
        int rung = Math.max(1, staleCount);
        int index = Math.min(ladder.size() - 1, rung - 1);
        return ladder.get(index);
    }

    public static int pauseThreshold(String messageType) {
        return STALE_PAUSE_THRESHOLDS.getOrDefault(messageType, 8);
    }

    public static LocalDateTime deployNextMessageAt(LocalDateTime lastMessageSentAt, LocalDateTime now) {
        if (lastMessageSentAt == null) {
            return now;
        }

        LocalDateTime cooldownEndsAt = lastMessageSentAt.plus(DEPLOY_EMAIL_COOLDOWN);
        if (cooldownEndsAt.isAfter(now)) {
            return cooldownEndsAt;
        }
        return now;
    }
}
