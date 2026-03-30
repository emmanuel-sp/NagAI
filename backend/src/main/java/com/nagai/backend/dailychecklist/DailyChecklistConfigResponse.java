package com.nagai.backend.dailychecklist;

import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nagai.backend.users.User;

public record DailyChecklistConfigResponse(
        Long configId,
        int maxItems,
        List<String> recurringItems,
        List<Long> includedGoalIds,
        boolean calendarEnabled,
        boolean calendarConnected) {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static DailyChecklistConfigResponse fromEntity(DailyChecklistConfig config, User user) {
        List<String> recurring = parseJson(config.getRecurringItems(), new TypeReference<>() {});
        List<Long> goalIds = parseJson(config.getIncludedGoalIds(), new TypeReference<>() {});
        return new DailyChecklistConfigResponse(
                config.getConfigId(), config.getMaxItems(), recurring, goalIds,
                config.isCalendarEnabled(), user.isCalendarConnected());
    }

    private static <T> T parseJson(String json, TypeReference<T> ref) {
        if (json == null || json.isBlank()) return null;
        try {
            return mapper.readValue(json, ref);
        } catch (Exception e) {
            return null;
        }
    }
}
