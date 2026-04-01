package com.nagai.backend.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.Optional;

public final class ChecklistTimestampUtils {

    private ChecklistTimestampUtils() {}

    public static Optional<LocalDateTime> parseCompletedAt(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(LocalDateTime.parse(value));
        } catch (DateTimeParseException ignored) {
        }

        try {
            return Optional.of(OffsetDateTime.parse(value).toLocalDateTime());
        } catch (DateTimeParseException ignored) {
        }

        try {
            return Optional.of(LocalDate.parse(value).atStartOfDay());
        } catch (DateTimeParseException ignored) {
        }

        try {
            return Optional.of(Instant.parse(value).atOffset(ZoneOffset.UTC).toLocalDateTime());
        } catch (DateTimeParseException ignored) {
        }

        return Optional.empty();
    }

    public static boolean isCompletedAfter(String completedAt, LocalDateTime threshold) {
        return parseCompletedAt(completedAt)
            .map(parsed -> parsed.isAfter(threshold))
            .orElse(false);
    }
}
