package com.nagai.backend.agents;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.common.ProfileUtils;
import com.nagai.backend.config.KafkaConfig;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;

import io.micrometer.core.instrument.Counter;

@Component
public class AgentScheduler {

    private static final Logger log = LoggerFactory.getLogger(AgentScheduler.class);

    static final Map<String, Long> BASE_INTERVALS = Map.of(
            "nag", 6L,
            "motivation", 24L,
            "guidance", 48L);

    static final Map<String, Long> MAX_INTERVALS = Map.of(
            "nag", 24L,
            "motivation", 72L,
            "guidance", 168L);

    private final AgentContextRepository agentContextRepository;
    private final AgentRepository agentRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final ChecklistRepository checklistRepository;
    private final SentAgentMessageRepository sentAgentMessageRepository;
    private final AgentReplyRepository agentReplyRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final Counter agentMessagesSentCounter;
    private final Counter agentMessagesFailedCounter;

    public AgentScheduler(AgentContextRepository agentContextRepository,
                          AgentRepository agentRepository,
                          UserRepository userRepository,
                          GoalRepository goalRepository,
                          ChecklistRepository checklistRepository,
                          SentAgentMessageRepository sentAgentMessageRepository,
                          AgentReplyRepository agentReplyRepository,
                          KafkaTemplate<String, String> kafkaTemplate,
                          Counter agentMessagesSentCounter,
                          Counter agentMessagesFailedCounter) {
        this.agentContextRepository = agentContextRepository;
        this.agentRepository = agentRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.checklistRepository = checklistRepository;
        this.sentAgentMessageRepository = sentAgentMessageRepository;
        this.agentReplyRepository = agentReplyRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.agentMessagesSentCounter = agentMessagesSentCounter;
        this.agentMessagesFailedCounter = agentMessagesFailedCounter;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
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
        List<AgentContext> contexts = agentContextRepository.findAllForDeployedAgents();

        if (contexts.isEmpty()) {
            log.debug("No deployed agent contexts found");
            return;
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        log.info("Checking {} deployed agent context(s) for due messages", contexts.size());

        for (AgentContext context : contexts) {
            try {
                DueCheckResult dueCheck = checkIfDue(context, now);
                if (!dueCheck.due()) continue;

                Agent agent = agentRepository.findById(context.getAgentId()).orElse(null);
                if (agent == null) continue;

                User user = userRepository.findById(agent.getUserId()).orElse(null);
                if (user == null) {
                    log.warn("User not found for agent {}", agent.getAgentId());
                    continue;
                }

                AgentMessagePayload payload = buildPayload(context, agent, user, dueCheck.checklistItems());
                String json = objectMapper.writeValueAsString(payload);

                ProducerRecord<String, String> record = new ProducerRecord<>(
                        KafkaConfig.TOPIC_AGENT_MESSAGES, String.valueOf(user.getUserId()), json);
                record.headers().add("x-correlation-id", correlationId.getBytes(StandardCharsets.UTF_8));
                kafkaTemplate.send(record).get(10, TimeUnit.SECONDS);

                context.setLastMessageSentAt(now);
                agentContextRepository.save(context);
                agentMessagesSentCounter.increment();

                log.info("Agent message published for context {} user {}",
                        context.getContextId(), user.getUserId());
            } catch (Exception e) {
                agentMessagesFailedCounter.increment();
                log.error("Failed to process agent context {}: {}",
                        context.getContextId(), e.getMessage(), e);
            }
        }
    }

    record DueCheckResult(boolean due, List<ChecklistItem> checklistItems) {}

    DueCheckResult checkIfDue(AgentContext context, LocalDateTime now) {
        String type = context.getMessageType();
        long baseHours = BASE_INTERVALS.getOrDefault(type, 24L);
        long maxHours = MAX_INTERVALS.getOrDefault(type, 72L);

        LocalDateTime lastSent = context.getLastMessageSentAt();
        long hoursSinceLast;

        if (lastSent == null) {
            hoursSinceLast = maxHours;
        } else {
            hoursSinceLast = Duration.between(lastSent, now).toHours();
        }

        List<ChecklistItem> items = (context.getGoalId() != null)
                ? checklistRepository.findChecklistItemByGoalId(context.getGoalId())
                : List.of();

        double modifier = 1.0;
        if (!items.isEmpty()) {
            long recentCompletions = items.stream()
                    .filter(ChecklistItem::isCompleted)
                    .filter(i -> i.getCompletedAt() != null)
                    .filter(i -> {
                        try {
                            LocalDate completed = LocalDateTime.parse(i.getCompletedAt()).toLocalDate();
                            return completed.isAfter(now.toLocalDate().minusDays(2));
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();

            if (recentCompletions >= 3) {
                modifier = 0.5;
            } else if (recentCompletions == 0 && hoursSinceLast > baseHours * 1.5) {
                modifier = 0.75;
            }
        }

        long effectiveHours = Math.max(2, Math.min(maxHours, (long) (baseHours * modifier)));
        return new DueCheckResult(hoursSinceLast >= effectiveHours, items);
    }

    AgentMessagePayload buildPayload(AgentContext context, Agent agent, User user, List<ChecklistItem> checklistItems) {
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
                .build();
    }

}
