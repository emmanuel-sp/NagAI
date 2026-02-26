package com.nagai.backend.checklists;

import lombok.Data;

@Data
public class ChecklistResponse {
    private Long checklistId;
    private Long goalId;
    private Long sortOrder;
    private boolean completed;
    private String completedAt;
    private String title;
    private String notes;
    private String deadline;

    public static ChecklistResponse fromEntity(ChecklistItem checklistItem) {
        ChecklistResponse checklistResponse = new ChecklistResponse();
        checklistResponse.checklistId = checklistItem.getChecklistId();
        checklistResponse.goalId = checklistItem.getGoalId();
        checklistResponse.sortOrder = checklistItem.getSortOrder();
        checklistResponse.completed = checklistItem.isCompleted();
        checklistResponse.completedAt = checklistItem.getCompletedAt();
        checklistResponse.title = checklistItem.getTitle();
        checklistResponse.notes = checklistItem.getNotes();
        checklistResponse.deadline = checklistItem.getDeadline();
        return checklistResponse;
    }
}
