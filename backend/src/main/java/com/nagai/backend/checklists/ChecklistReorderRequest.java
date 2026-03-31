package com.nagai.backend.checklists;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChecklistReorderRequest {

    @NotNull(message = "orderedItemIds is required")
    private List<Long> orderedItemIds;
}
