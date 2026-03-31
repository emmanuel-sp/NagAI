package com.nagai.backend.dailychecklist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DailyChecklistItemCreateRequest {

    @NotBlank(message = "title is required")
    @Size(max = 200, message = "title must be 200 characters or fewer")
    private String title;

    @Size(max = 500, message = "notes must be 500 characters or fewer")
    private String notes;

    @Size(max = 10, message = "scheduledTime must be 10 characters or fewer")
    private String scheduledTime;
}
