package com.nagai.backend.dailychecklist;

import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public record DailyChecklistConfigResponse(
        Long configId,
        int maxItems,
        List<String> recurringItems,
        List<Long> includedGoalIds) {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static DailyChecklistConfigResponse fromEntity(DailyChecklistConfig config) {
        List<String> recurring = parseJson(config.getRecurringItems(), new TypeReference<>() {});
        List<Long> goalIds = parseJson(config.getIncludedGoalIds(), new TypeReference<>() {});
        return new DailyChecklistConfigResponse(
                config.getConfigId(), config.getMaxItems(), recurring, goalIds);
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
