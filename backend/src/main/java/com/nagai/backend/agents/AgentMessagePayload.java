package com.nagai.backend.agents;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentMessagePayload {

    private Long contextId;
    private Long userId;
    private String userEmail;
    private String userName;
    private String userProfile;

    private String agentName;
    private String contextName;
    private String messageType;
    private String customInstructions;

    private GoalPayload goal;
    private List<ConversationEntry> conversationHistory;
    private List<String> previousMessageIds;
    private List<String> previousSubjects;
    private int messagesSinceLastChange;

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

    @Data
    @Builder
    public static class ConversationEntry {
        private String role;
        private String content;
        private String sentAt;
    }
}
