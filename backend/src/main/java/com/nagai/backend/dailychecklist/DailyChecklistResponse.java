package com.nagai.backend.dailychecklist;

import java.util.List;

public record DailyChecklistResponse(
        Long dailyChecklistId,
        String planDate,
        String generatedAt,
        Integer generationCount,
        List<DailyChecklistItemResponse> items) {
}
