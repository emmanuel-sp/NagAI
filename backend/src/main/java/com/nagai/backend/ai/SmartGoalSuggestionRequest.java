package com.nagai.backend.ai;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record SmartGoalSuggestionRequest(
        @NotBlank String field,
        @NotBlank String goalTitle,
        String goalDescription,
        Map<String, String> existingFields,
        String stepsTaken
) {}
