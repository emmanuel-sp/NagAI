package com.nagai.backend.digests;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DigestDeliveryPayload {

    private Long digestId;
    private Long userId;
    private String userEmail;
    private String userName;
    private String userLocation;
    private String userProfile;
    private String[] contentTypes;
    private String lastDeliveredAt;
    private List<GoalPayload> goals;

    @Data
    @Builder
    public static class GoalPayload {
        private String title;
        private String description;
        private String smartContext;
        private List<ChecklistItemPayload> checklistItems;
    }

    @Data
    @Builder
    public static class ChecklistItemPayload {
        private String title;
        private boolean completed;
        private String completedAt;
        private String deadline;
    }
}
