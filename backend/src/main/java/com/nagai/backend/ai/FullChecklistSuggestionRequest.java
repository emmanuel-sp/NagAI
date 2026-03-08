package com.nagai.backend.ai;

import jakarta.validation.constraints.NotNull;

public record FullChecklistSuggestionRequest(
        @NotNull Long goalId
) {}
