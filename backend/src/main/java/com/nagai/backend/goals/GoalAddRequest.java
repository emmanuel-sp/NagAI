package com.nagai.backend.goals;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoalAddRequest {
    @NotBlank(message = "title is required")
    @Size(max = 200, message = "title must be 200 characters or fewer")
    private String title;
    @Size(max = 1000, message = "description must be 1000 characters or fewer")
    private String description;
    private String targetDate;
    @Size(max = 1000, message = "specific must be 1000 characters or fewer")
    private String specific;
    @Size(max = 1000, message = "measurable must be 1000 characters or fewer")
    private String measurable;
    @Size(max = 1000, message = "attainable must be 1000 characters or fewer")
    private String attainable;
    @Size(max = 1000, message = "relevant must be 1000 characters or fewer")
    private String relevant;
    @Size(max = 1000, message = "timely must be 1000 characters or fewer")
    private String timely;
}
