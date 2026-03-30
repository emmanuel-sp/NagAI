package com.nagai.backend.agents;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.AgentContextLimitException;
import com.nagai.backend.exceptions.AgentContextNotFoundException;
import com.nagai.backend.exceptions.DuplicateGoalContextException;
import com.nagai.backend.goals.Goal;
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
        List<AgentContext> contexts = agentContextRepository.findByAgentId(agent.getAgentId());
        contexts.forEach(context -> {
            context.setDeployed(true);
            context.setNextMessageAt(null);
        });
        agent.setDeployed(!contexts.isEmpty());
        agentContextRepository.saveAll(contexts);
        return buildResponse(agentRepository.save(agent));
    }

    public AgentResponse stopAgent() {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        List<AgentContext> contexts = agentContextRepository.findByAgentId(agent.getAgentId());
        contexts.forEach(context -> context.setDeployed(false));
        agentContextRepository.saveAll(contexts);
        agent.setDeployed(false);
        return buildResponse(agentRepository.save(agent));
    }

    private static final int MAX_CONTEXTS = 3;

    public AgentContextResponse addContext(AddContextRequest request) {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        List<AgentContext> existing = agentContextRepository.findByAgentId(agent.getAgentId());
        if (existing.size() >= MAX_CONTEXTS) {
            throw new AgentContextLimitException();
        }
        if (agentContextRepository.existsByAgentIdAndGoalId(agent.getAgentId(), request.getGoalId())) {
            throw new DuplicateGoalContextException();
        }
        AgentContext context = new AgentContext();
        context.setAgentId(agent.getAgentId());
        Goal goal = validateGoalOwnership(request.getGoalId(), user);
        applyContextFields(context, request.getName(), goal.getGoalId(),
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
        if (!context.getGoalId().equals(request.getGoalId())
                && agentContextRepository.existsByAgentIdAndGoalId(agent.getAgentId(), request.getGoalId())) {
            throw new DuplicateGoalContextException();
        }
        Goal goal = validateGoalOwnership(request.getGoalId(), user);
        if (request.getName() != null) context.setName(request.getName());
        context.setGoalId(goal.getGoalId());
        if (request.getMessageType() != null) context.setMessageType(request.getMessageType());
        if (request.getCustomInstructions() != null) context.setCustomInstructions(request.getCustomInstructions());
        return buildContextResponse(agentContextRepository.save(context));
    }

    public AgentContextResponse deployContext(Long contextId) {
        AgentContext context = getOwnedContext(contextId);
        context.setDeployed(true);
        context.setNextMessageAt(null);
        AgentContext saved = agentContextRepository.save(context);
        syncAgentDeploymentFlag(saved.getAgentId());
        return buildContextResponse(saved);
    }

    public AgentContextResponse stopContext(Long contextId) {
        AgentContext context = getOwnedContext(contextId);
        context.setDeployed(false);
        AgentContext saved = agentContextRepository.save(context);
        syncAgentDeploymentFlag(saved.getAgentId());
        return buildContextResponse(saved);
    }

    public void deleteContext(Long contextId) {
        AgentContext context = getOwnedContext(contextId);
        Long agentId = context.getAgentId();
        agentContextRepository.delete(context);
        syncAgentDeploymentFlag(agentId);
    }

    public void stopByToken(String token) {
        Agent agent = agentRepository.findByUnsubscribeToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        List<AgentContext> contexts = agentContextRepository.findByAgentId(agent.getAgentId());
        contexts.forEach(context -> context.setDeployed(false));
        agentContextRepository.saveAll(contexts);
        agent.setDeployed(false);
        agentRepository.save(agent);
    }

    private Agent createDefaultAgent(Long userId) {
        Agent agent = new Agent();
        agent.setUserId(userId);
        agent.setName("My AI Agent");
        agent.setUnsubscribeToken(UUID.randomUUID().toString());
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

    private AgentContext getOwnedContext(Long contextId) {
        User user = userService.getCurrentUser();
        Agent agent = agentRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultAgent(user.getUserId()));
        return agentContextRepository.findById(contextId)
                .filter(c -> c.getAgentId().equals(agent.getAgentId()))
                .orElseThrow(AgentContextNotFoundException::new);
    }

    private Goal validateGoalOwnership(Long goalId, User user) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new AccessDeniedException("You do not have permission to use this goal"));
        if (!user.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to use this goal");
        }
        return goal;
    }

    private void syncAgentDeploymentFlag(Long agentId) {
        Agent agent = agentRepository.findById(agentId).orElse(null);
        if (agent == null) return;

        boolean anyDeployed = agentContextRepository.findByAgentId(agentId).stream()
                .anyMatch(AgentContext::isDeployed);
        agent.setDeployed(anyDeployed);
        agentRepository.save(agent);
    }
}
