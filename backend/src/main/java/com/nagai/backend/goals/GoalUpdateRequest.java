package com.nagai.backend.goals;

import lombok.Data;

@Data
public class GoalUpdateRequest {
    private Long goalId;
    private String title;
    private String description;
    private String targetDate;
    private String specific;
    private String measurable;
    private String attainable;
    private String relevant;
    private String timely;
}
