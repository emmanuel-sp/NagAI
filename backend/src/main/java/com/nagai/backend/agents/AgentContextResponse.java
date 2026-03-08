package com.nagai.backend.agents;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AgentContextResponse {
    private Long contextId;
    private Long agentId;
    private Long goalId;
    private String goalName;
    private String name;
    private String messageType;
    private String messageFrequency;
    private String customInstructions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AgentContextResponse fromEntity(AgentContext context, String goalName) {
        AgentContextResponse response = new AgentContextResponse();
        response.setContextId(context.getContextId());
        response.setAgentId(context.getAgentId());
        response.setGoalId(context.getGoalId());
        response.setGoalName(goalName);
        response.setName(context.getName());
        response.setMessageType(context.getMessageType());
        response.setMessageFrequency(context.getMessageFrequency());
        response.setCustomInstructions(context.getCustomInstructions());
        response.setCreatedAt(context.getCreatedAt());
        response.setUpdatedAt(context.getUpdatedAt());
        return response;
    }
}
