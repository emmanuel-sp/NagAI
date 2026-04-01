package com.nagai.backend.agents;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.common.ChecklistTimestampUtils;
import com.nagai.backend.common.ProfileUtils;
import com.nagai.backend.config.RedisStreamConfig;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;

import io.micrometer.core.instrument.Counter;

@Component
public class AgentScheduler {

    private static final Logger log = LoggerFactory.getLogger(AgentScheduler.class);
    private static final Duration CLAIM_TTL = Duration.ofMinutes(15);

    private final AgentContextRepository agentContextRepository;
    private final AgentRepository agentRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final ChecklistRepository checklistRepository;
    private final SentAgentMessageRepository sentAgentMessageRepository;
    private final AgentReplyRepository agentReplyRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final TaskScheduler taskScheduler;
    private final Counter agentMessagesSentCounter;
    private final Counter agentMessagesFailedCounter;

    private final Map<Long, ScheduledFuture<?>> timers = new ConcurrentHashMap<>();

    public AgentScheduler(AgentContextRepository agentContextRepository,
                          AgentRepository agentRepository,
                          UserRepository userRepository,
                          GoalRepository goalRepository,
                          ChecklistRepository checklistRepository,
                          SentAgentMessageRepository sentAgentMessageRepository,
                          AgentReplyRepository agentReplyRepository,
                          StringRedisTemplate redisTemplate,
                          TaskScheduler taskScheduler,
                          Counter agentMessagesSentCounter,
                          Counter agentMessagesFailedCounter) {
        this.agentContextRepository = agentContextRepository;
        this.agentRepository = agentRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.checklistRepository = checklistRepository;
        this.sentAgentMessageRepository = sentAgentMessageRepository;
        this.agentReplyRepository = agentReplyRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.taskScheduler = taskScheduler;
        this.agentMessagesSentCounter = agentMessagesSentCounter;
        this.agentMessagesFailedCounter = agentMessagesFailedCounter;
    }

    /**
     * Safety sweep — only loads contexts that are actually due (or newly deployed with null nextMessageAt).
     * Runs every 5 minutes instead of the old 60-second poll that recomputed heuristics for ALL contexts.
     */
    @Scheduled(fixedRate = 300_000, initialDelay = 30_000)
    public void processAgentMessages() {
        String correlationId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("correlationId", correlationId);

        try {
            processAgentMessagesInternal(correlationId);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void processAgentMessagesInternal(String correlationId) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        List<AgentContext> dueContexts = agentContextRepository.findDueForDeployedAgents(now);

        if (dueContexts.isEmpty()) {
            log.debug("Sweep: no due agent contexts found");
            return;
        }

        log.info("Found {} due agent context(s) to process", dueContexts.size());

        for (AgentContext context : dueContexts) {
            processAgentContextById(context.getContextId(), now, correlationId);
        }
    }

    /** Timer entry point — fired at the exact scheduled message time. */
    void onAgentTimerFired(Long contextId) {
        timers.remove(contextId);
        String correlationId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("correlationId", correlationId);

        try {
            log.info("Timer: processing agent context {}", contextId);
            processAgentContextById(contextId, LocalDateTime.now(ZoneOffset.UTC), correlationId);
        } catch (Exception e) {
            agentMessagesFailedCounter.increment();
            log.error("Timer: failed for context {}: {}", contextId, e.getMessage(), e);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void processAgentContextById(Long contextId, LocalDateTime now, String correlationId) {
        if (!claimContext(contextId, now)) {
            return;
        }

        AgentContext context = agentContextRepository.findById(contextId).orElse(null);
        if (context == null || !context.isDeployed()) {
            agentContextRepository.clearProcessingClaim(contextId);
            return;
        }
        if (context.getNextMessageAt() != null && context.getNextMessageAt().isAfter(now)) {
            agentContextRepository.clearProcessingClaim(contextId);
            return;
        }

        processAgentContext(context, now, correlationId);
    }

    private boolean claimContext(Long contextId, LocalDateTime now) {
        return agentContextRepository.claimDueContext(
                contextId,
                now,
                now,
                now.minus(CLAIM_TTL)
        ) == 1;
    }

    private void processAgentContext(AgentContext context, LocalDateTime now, String correlationId) {
        try {
            Agent agent = agentRepository.findById(context.getAgentId()).orElse(null);
            if (agent == null) {
                agentContextRepository.clearProcessingClaim(context.getContextId());
                return;
            }

            User user = userRepository.findById(agent.getUserId()).orElse(null);
            if (user == null) {
                log.warn("User not found for agent {}", agent.getAgentId());
                agentContextRepository.clearProcessingClaim(context.getContextId());
                return;
            }

            // Load data needed for payload and next-schedule computation
            List<ChecklistItem> checklistItems = (context.getGoalId() != null)
                    ? checklistRepository.findChecklistItemByGoalId(context.getGoalId())
                    : List.of();
            boolean checklistActivitySinceLastMessage = hasChecklistActivitySinceLastMessage(context);
            int messagesSinceLastChange = computeStaleCountForCurrentSend(context);

            AgentMessagePayload payload = buildPayload(context, agent, user,
                    checklistItems, messagesSinceLastChange);
            String json = objectMapper.writeValueAsString(payload);

            Map<String, String> fields = Map.of(
                    "key", String.valueOf(user.getUserId()),
                    "correlationId", correlationId,
                    "payload", json);
            redisTemplate.opsForStream().add(RedisStreamConfig.STREAM_AGENT_MESSAGES, fields);

            context.setLastMessageSentAt(now);
            context.setStaleCount(messagesSinceLastChange);

            if (messagesSinceLastChange >= AgentCadence.pauseThreshold(context.getMessageType())) {
                context.setDeployed(false);
                context.setNextMessageAt(null);
                context.setPauseReason(AgentCadence.PAUSE_REASON_STALE_PROGRESS);
                context.setProcessingStartedAt(null);
                agentContextRepository.save(context);
                cancelTimer(context.getContextId());
                syncAgentDeploymentFlag(context.getAgentId());
                agentMessagesSentCounter.increment();
                log.info("Agent context {} auto-paused after {} stale sends",
                        context.getContextId(), messagesSinceLastChange);
                return;
            }

            // Compute and persist the next message time (heuristic runs once per send, not per sweep)
            LocalDateTime nextMessageAt = computeNextMessageAt(
                    context, checklistItems, checklistActivitySinceLastMessage, messagesSinceLastChange, now);
            context.setNextMessageAt(nextMessageAt);
            context.setPauseReason(null);
            context.setProcessingStartedAt(null);
            agentContextRepository.save(context);

            // Schedule a precise timer for the next message
            scheduleTimer(context.getContextId(), nextMessageAt);
            agentMessagesSentCounter.increment();

            log.info("Agent message published for context {} user {}, next at {}",
                    context.getContextId(), user.getUserId(), nextMessageAt);
        } catch (Exception e) {
            agentContextRepository.clearProcessingClaim(context.getContextId());
            agentMessagesFailedCounter.increment();
            log.error("Failed to process agent context {}: {}",
                    context.getContextId(), e.getMessage(), e);
        }
    }

    /**
     * Computes when the next message should fire based on the current heuristic.
     * Called once after each send — not on every sweep iteration.
     */
    LocalDateTime computeNextMessageAt(AgentContext context, List<ChecklistItem> items,
                                        boolean checklistActivitySinceLastMessage,
                                        int staleCountAfterSend, LocalDateTime now) {
        long effectiveHours;
        if (checklistActivitySinceLastMessage && hasHighRecentCompletionActivity(items, now)) {
            effectiveHours = AgentCadence.acceleratedIntervalHours(context.getMessageType());
        } else if (checklistActivitySinceLastMessage) {
            effectiveHours = AgentCadence.baseIntervalHours(context.getMessageType());
        } else {
            effectiveHours = AgentCadence.staleIntervalHours(context.getMessageType(), staleCountAfterSend);
        }
        return now.plusHours(effectiveHours);
    }

    int computeStaleCountForCurrentSend(AgentContext context) {
        if (hasChecklistActivitySinceLastMessage(context)) {
            return 1;
        }
        return Math.max(0, context.getStaleCount()) + 1;
    }

    boolean hasChecklistActivitySinceLastMessage(AgentContext context) {
        LocalDateTime lastChecklistActivityAt = context.getLastChecklistActivityAt();
        if (lastChecklistActivityAt == null) {
            return false;
        }

        LocalDateTime lastMessageSentAt = context.getLastMessageSentAt();
        return lastMessageSentAt == null || lastChecklistActivityAt.isAfter(lastMessageSentAt);
    }

    private boolean hasHighRecentCompletionActivity(List<ChecklistItem> items, LocalDateTime now) {
        return items.stream()
                .filter(ChecklistItem::isCompleted)
                .map(ChecklistItem::getCompletedAt)
                .map(ChecklistTimestampUtils::parseCompletedAt)
                .flatMap(java.util.Optional::stream)
                .filter(completedAt -> completedAt.isAfter(now.minusDays(2)))
                .count() >= 3;
    }

    void scheduleTimer(Long contextId, LocalDateTime nextMessageAt) {
        cancelTimer(contextId);
        if (nextMessageAt == null) return;
        Instant fireAt = nextMessageAt.toInstant(ZoneOffset.UTC);
        if (!fireAt.isAfter(Instant.now())) return;

        ScheduledFuture<?> future = taskScheduler.schedule(
                () -> onAgentTimerFired(contextId), fireAt);
        if (future != null) {
            timers.put(contextId, future);
        }
        log.debug("Scheduled timer for agent context {} at {}", contextId, nextMessageAt);
    }

    private void cancelTimer(Long contextId) {
        ScheduledFuture<?> existing = timers.remove(contextId);
        if (existing != null) existing.cancel(false);
    }

    AgentMessagePayload buildPayload(AgentContext context, Agent agent, User user,
                                      List<ChecklistItem> checklistItems, int messagesSinceLastChange) {
        AgentMessagePayload.GoalPayload goalPayload = null;
        if (context.getGoalId() != null) {
            Goal goal = goalRepository.findById(context.getGoalId()).orElse(null);
            if (goal != null) {
                List<AgentMessagePayload.ChecklistItemPayload> itemPayloads = checklistItems.stream()
                        .map(item -> AgentMessagePayload.ChecklistItemPayload.builder()
                                .title(item.getTitle())
                                .completed(item.isCompleted())
                                .completedAt(item.getCompletedAt())
                                .deadline(item.getDeadline())
                                .build())
                        .collect(Collectors.toList());

                goalPayload = AgentMessagePayload.GoalPayload.builder()
                        .title(goal.getTitle())
                        .description(goal.getDescription())
                        .smartContext(ProfileUtils.buildGoalSmartContext(goal))
                        .checklistItems(itemPayloads)
                        .build();
            }
        }

        // Build conversation history from sent messages + replies
        List<SentAgentMessage> recentMessages = sentAgentMessageRepository
                .findTop5ByContextIdOrderBySentAtDesc(context.getContextId());
        Collections.reverse(recentMessages); // oldest first

        List<Long> sentMessageIds = recentMessages.stream()
                .map(SentAgentMessage::getSentMessageId)
                .collect(Collectors.toList());

        Map<Long, List<AgentReply>> repliesByMessageId = sentMessageIds.isEmpty()
                ? Map.of()
                : agentReplyRepository.findBySentMessageIdIn(sentMessageIds).stream()
                        .collect(Collectors.groupingBy(AgentReply::getSentMessageId));

        List<AgentMessagePayload.ConversationEntry> history = new ArrayList<>();
        List<String> previousMessageIds = new ArrayList<>();
        List<String> previousSubjects = recentMessages.stream()
                .map(SentAgentMessage::getSubject)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toList());

        for (SentAgentMessage msg : recentMessages) {
            history.add(AgentMessagePayload.ConversationEntry.builder()
                    .role("agent")
                    .content(msg.getContent())
                    .sentAt(msg.getSentAt() != null ? msg.getSentAt().toString() : null)
                    .build());

            if (msg.getEmailMessageId() != null) {
                previousMessageIds.add(msg.getEmailMessageId());
            }

            List<AgentReply> replies = repliesByMessageId.getOrDefault(msg.getSentMessageId(), List.of());
            for (AgentReply reply : replies) {
                history.add(AgentMessagePayload.ConversationEntry.builder()
                        .role("user")
                        .content(reply.getContent())
                        .sentAt(reply.getReceivedAt() != null ? reply.getReceivedAt().toString() : null)
                        .build());
            }
        }

        return AgentMessagePayload.builder()
                .contextId(context.getContextId())
                .userId(user.getUserId())
                .userEmail(user.getEmail())
                .userName(user.getFullName())
                .userProfile(ProfileUtils.buildUserProfile(user))
                .agentName(agent.getName())
                .contextName(context.getName())
                .messageType(context.getMessageType())
                .customInstructions(context.getCustomInstructions())
                .goal(goalPayload)
                .conversationHistory(history)
                .previousMessageIds(previousMessageIds)
                .previousSubjects(previousSubjects)
                .messagesSinceLastChange(messagesSinceLastChange)
                .unsubscribeToken(agent.getUnsubscribeToken())
                .build();
    }

    private void syncAgentDeploymentFlag(Long agentId) {
        Agent agent = agentRepository.findById(agentId).orElse(null);
        if (agent == null) {
            return;
        }

        boolean anyDeployed = agentContextRepository.findByAgentId(agentId).stream()
                .anyMatch(AgentContext::isDeployed);
        agent.setDeployed(anyDeployed);
        agentRepository.save(agent);
    }

}
