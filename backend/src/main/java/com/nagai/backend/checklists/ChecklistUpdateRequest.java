package com.nagai.backend.checklists;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChecklistUpdateRequest {

    @NotNull(message = "checklistId is required")
    private Long checklistId;

    @NotBlank(message = "title is required")
    private String title;

    private String notes;
    private String deadline;
    private Long sortOrder;
    private Boolean completed;
}
