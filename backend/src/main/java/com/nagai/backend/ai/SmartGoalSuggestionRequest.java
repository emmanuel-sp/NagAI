package com.nagai.backend.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record SmartGoalSuggestionRequest(
        @NotBlank @Size(max = 50) String field,
        @NotBlank @Size(max = 200) String goalTitle,
        @Size(max = 2000) String goalDescription,
        Map<String, String> existingFields,
        @Size(max = 2000) String stepsTaken,
        @Size(max = 20) String targetDate
) {}
