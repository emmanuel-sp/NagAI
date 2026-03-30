package com.nagai.backend.dailychecklist;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record DailyChecklistConfigRequest(
        @Min(1) @Max(12) Integer maxItems,
        List<String> recurringItems,
        List<Long> includedGoalIds,
        Boolean calendarEnabled) {
}
