package com.nagai.backend.dailychecklist;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DailyChecklistReorderRequest {

    @NotNull(message = "orderedItemIds is required")
    private List<Long> orderedItemIds;
}
