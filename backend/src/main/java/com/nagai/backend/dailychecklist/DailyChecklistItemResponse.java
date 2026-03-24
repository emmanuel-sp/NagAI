package com.nagai.backend.dailychecklist;

public record DailyChecklistItemResponse(
        Long dailyItemId,
        Long parentChecklistId,
        Long parentGoalId,
        String parentGoalTitle,
        int sortOrder,
        String title,
        String notes,
        String scheduledTime,
        boolean completed,
        String completedAt) {

    public static DailyChecklistItemResponse fromEntity(DailyChecklistItem item,
                                                         Long parentGoalId,
                                                         String parentGoalTitle) {
        return new DailyChecklistItemResponse(
                item.getDailyItemId(),
                item.getParentChecklistId(),
                parentGoalId,
                parentGoalTitle,
                item.getSortOrder(),
                item.getTitle(),
                item.getNotes(),
                item.getScheduledTime(),
                item.isCompleted(),
                item.getCompletedAt());
    }
}
