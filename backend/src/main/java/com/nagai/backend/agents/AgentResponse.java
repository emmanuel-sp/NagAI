package com.nagai.backend.agents;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class AgentResponse {
    private Long agentId;
    private Long userId;
    private String name;
    private boolean deployed;
    private String communicationChannel;
    private List<AgentContextResponse> contexts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AgentResponse fromEntity(Agent agent, List<AgentContextResponse> contexts) {
        AgentResponse response = new AgentResponse();
        response.setAgentId(agent.getAgentId());
        response.setUserId(agent.getUserId());
        response.setName(agent.getName());
        response.setDeployed(agent.isDeployed());
        response.setCommunicationChannel(agent.getCommunicationChannel());
        response.setContexts(contexts);
        response.setCreatedAt(agent.getCreatedAt());
        response.setUpdatedAt(agent.getUpdatedAt());
        return response;
    }
}
