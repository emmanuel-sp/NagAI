package com.nagai.backend.checklists;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChecklistAddRequest {

    @NotNull(message = "goalId is required")
    private Long goalId;

    @NotBlank(message = "title is required")
    @Size(max = 200, message = "title must be 200 characters or fewer")
    private String title;

    @Size(max = 500, message = "notes must be 500 characters or fewer")
    private String notes;
    private String deadline;
    private Long sortOrder;
}
