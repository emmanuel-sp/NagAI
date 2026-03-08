package com.nagai.backend.ai;

import jakarta.validation.constraints.NotNull;

public record ChecklistItemSuggestionRequest(
        @NotNull Long goalId
) {}
