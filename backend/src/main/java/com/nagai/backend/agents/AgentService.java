package com.nagai.backend.agents;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.AgentContextLimitException;
import com.nagai.backend.exceptions.AgentContextNotFoundException;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@Service
public class AgentService {

    private final AgentRepository agentRepository;
    private final AgentContextRepository agentContextRepository;
    private final GoalRepository goalRepository;
    private final UserService userService;

    public AgentService(AgentRepository agentRepository,
                        AgentContextRepository agentContextRepository,
                        GoalRepository goalRepository,
                        UserService userService) {
        this.agentRepository = agentRepository;
        this.agentContextRepository = agentContextRepository;
        this.goalRepository = goalRepository;
        this.userService = userService;
    }

    public AgentResponse getOrCreateAgent() {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        return buildResponse(agent);
    }

    public AgentResponse updateCommunicationChannel(CommunicationChannelRequest request) {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        agent.setCommunicationChannel(request.getChannel());
        return buildResponse(agentRepository.save(agent));
    }

    public AgentResponse deployAgent() {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        agent.setDeployed(true);
        return buildResponse(agentRepository.save(agent));
    }

    public AgentResponse stopAgent() {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        agent.setDeployed(false);
        return buildResponse(agentRepository.save(agent));
    }

    private static final int MAX_CONTEXTS = 4;

    public AgentContextResponse addContext(AddContextRequest request) {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        List<AgentContext> existing = agentContextRepository.findByAgentId(agent.getAgentId());
        if (existing.size() >= MAX_CONTEXTS) {
            throw new AgentContextLimitException();
        }
        AgentContext context = new AgentContext();
        context.setAgentId(agent.getAgentId());
        applyContextFields(context, request.getName(), request.getGoalId(),
                request.getMessageType(), request.getCustomInstructions());
        return buildContextResponse(agentContextRepository.save(context));
    }

    public AgentContextResponse updateContext(Long contextId, UpdateContextRequest request) {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        AgentContext context = agentContextRepository.findById(contextId)
                .filter(c -> c.getAgentId().equals(agent.getAgentId()))
                .orElseThrow(AgentContextNotFoundException::new);
        if (request.getName() != null) context.setName(request.getName());
        if (request.getGoalId() != null) context.setGoalId(request.getGoalId());
        if (request.getMessageType() != null) context.setMessageType(request.getMessageType());
        if (request.getCustomInstructions() != null) context.setCustomInstructions(request.getCustomInstructions());
        return buildContextResponse(agentContextRepository.save(context));
    }

    public void deleteContext(Long contextId) {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        AgentContext context = agentContextRepository.findById(contextId)
                .filter(c -> c.getAgentId().equals(agent.getAgentId()))
                .orElseThrow(AgentContextNotFoundException::new);
        agentContextRepository.delete(context);
    }

    private Agent createDefaultAgent(Long userId) {
        Agent agent = new Agent();
        agent.setUserId(userId);
        agent.setName("My AI Agent");
        return agentRepository.save(agent);
    }

    private AgentResponse buildResponse(Agent agent) {
        List<AgentContext> contexts = agentContextRepository.findByAgentId(agent.getAgentId());
        List<AgentContextResponse> contextResponses = contexts.stream()
                .map(this::buildContextResponse)
                .toList();
        return AgentResponse.fromEntity(agent, contextResponses);
    }

    private AgentContextResponse buildContextResponse(AgentContext context) {
        String goalName = null;
        if (context.getGoalId() != null) {
            goalName = goalRepository.findById(context.getGoalId())
                    .map(g -> g.getTitle())
                    .orElse(null);
        }
        return AgentContextResponse.fromEntity(context, goalName);
    }

    private void applyContextFields(AgentContext context, String name, Long goalId,
                                     String messageType, String customInstructions) {
        context.setName(name);
        context.setGoalId(goalId);
        context.setMessageType(messageType);
        context.setCustomInstructions(customInstructions);
    }
}
