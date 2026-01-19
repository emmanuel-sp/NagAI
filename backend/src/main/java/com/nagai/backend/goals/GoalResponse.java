package com.nagai.backend.goals;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class GoalResponse {
    private Long goalId;
    private String title;
    private String description;
    private String targetDate;
    private String specific;
    private String measurable;
    private String attainable;
    private String relevant;
    private String timely;
    private LocalDateTime createdAt;

    public static GoalResponse fromEntity(Goal goal) {
        GoalResponse goalResponse = new GoalResponse();
        goalResponse.setGoalId(goal.getGoalId());
        goalResponse.setCreatedAt(goal.getCreatedAt());
        goalResponse.setTitle(goal.getTitle());
        goalResponse.setDescription(goal.getDescription());
        goalResponse.setTargetDate(goal.getTargetDate());
        goalResponse.setSpecific(goal.getSpecific());
        goalResponse.setMeasurable(goal.getMeasurable());
        goalResponse.setAttainable(goal.getAttainable());
        goalResponse.setRelevant(goal.getRelevant());
        goalResponse.setTimely(goal.getTimely());
        return goalResponse;
    }
}
