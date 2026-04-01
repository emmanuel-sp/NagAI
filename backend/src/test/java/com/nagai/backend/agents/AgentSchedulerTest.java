package com.nagai.backend.agents;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StreamOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.TaskScheduler;

import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.config.RedisStreamConfig;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;

import io.micrometer.core.instrument.Counter;

@ExtendWith(MockitoExtension.class)
class AgentSchedulerTest {

    @Mock private AgentContextRepository agentContextRepository;
    @Mock private AgentRepository agentRepository;
    @Mock private UserRepository userRepository;
    @Mock private GoalRepository goalRepository;
    @Mock private ChecklistRepository checklistRepository;
    @Mock private SentAgentMessageRepository sentAgentMessageRepository;
    @Mock private AgentReplyRepository agentReplyRepository;
    @Mock private StringRedisTemplate redisTemplate;
    @SuppressWarnings("rawtypes")
    @Mock private StreamOperations streamOps;
    @Mock private TaskScheduler taskScheduler;
    @Mock private Counter agentMessagesSentCounter;
    @Mock private Counter agentMessagesFailedCounter;

    private AgentScheduler agentScheduler;

    private User user;
    private Agent agent;
    private AgentContext context;
    private Goal goal;
    private ChecklistItem item;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForStream()).thenReturn(streamOps);
        lenient().when(agentContextRepository.claimDueContext(anyLong(), any(LocalDateTime.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(1);
        lenient().when(agentContextRepository.clearProcessingClaim(anyLong())).thenReturn(1);

        agentScheduler = new AgentScheduler(
                agentContextRepository, agentRepository, userRepository,
                goalRepository, checklistRepository, sentAgentMessageRepository,
                agentReplyRepository, redisTemplate, taskScheduler,
                agentMessagesSentCounter, agentMessagesFailedCounter);

        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");
        user.setFullName("Test User");
        user.setCareer("Engineer");

        agent = new Agent();
        agent.setAgentId(10L);
        agent.setUserId(1L);
        agent.setName("My AI Agent");
        agent.setDeployed(true);

        context = new AgentContext();
        context.setContextId(100L);
        context.setAgentId(10L);
        context.setGoalId(200L);
        context.setName("Morning Check");
        context.setMessageType("motivation");
        context.setDeployed(true);
        context.setStaleCount(0);
        context.setLastMessageSentAt(null); // never sent
        lenient().when(agentContextRepository.findById(100L)).thenReturn(Optional.of(context));
        lenient().when(agentContextRepository.findByAgentId(10L)).thenReturn(List.of(context));

        goal = new Goal();
        goal.setGoalId(200L);
        goal.setUserId(1L);
        goal.setTitle("Learn Spanish");
        goal.setDescription("Become conversational");
        goal.setSpecific("Pass B2 exam");

        item = new ChecklistItem();
        item.setChecklistId(1000L);
        item.setGoalId(200L);
        item.setTitle("Buy textbook");
        item.setCompleted(true);
        item.setCompletedAt("2026-03-10T10:00:00");
    }

    @SuppressWarnings("unchecked")
    @Test
    void processAgentMessages_publishesToRedisForDueContexts() {
        when(agentContextRepository.findDueForDeployedAgents(any(LocalDateTime.class)))
                .thenReturn(List.of(context));
        when(agentRepository.findById(10L)).thenReturn(Optional.of(agent));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(checklistRepository.findChecklistItemByGoalId(200L)).thenReturn(List.of(item));
        when(sentAgentMessageRepository.findTop5ByContextIdOrderBySentAtDesc(100L)).thenReturn(List.of());
        when(goalRepository.findById(200L)).thenReturn(Optional.of(goal));

        agentScheduler.processAgentMessages();

        ArgumentCaptor<String> streamCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, String>> fieldsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(streamOps).add(streamCaptor.capture(), fieldsCaptor.capture());

        assertThat(streamCaptor.getValue()).isEqualTo(RedisStreamConfig.STREAM_AGENT_MESSAGES);
        Map<String, String> fields = fieldsCaptor.getValue();
        assertThat(fields.get("key")).isEqualTo("1");
        assertThat(fields.get("payload")).contains("Learn Spanish");
        assertThat(fields.get("payload")).contains("test@example.com");
        assertThat(fields.get("payload")).contains("Morning Check");
        assertThat(fields.get("correlationId")).isNotNull();

        verify(agentContextRepository).save(context);
        assertThat(context.getLastMessageSentAt()).isNotNull();
        assertThat(context.getNextMessageAt()).isNotNull();
    }

    @Test
    void processAgentMessages_nothingDue() {
        when(agentContextRepository.findDueForDeployedAgents(any(LocalDateTime.class)))
                .thenReturn(List.of());

        agentScheduler.processAgentMessages();

        verifyNoInteractions(redisTemplate);
    }

    @SuppressWarnings("unchecked")
    @Test
    void processAgentMessages_skipsWhenUserNotFound() {
        when(agentContextRepository.findDueForDeployedAgents(any(LocalDateTime.class)))
                .thenReturn(List.of(context));
        when(agentRepository.findById(10L)).thenReturn(Optional.of(agent));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        agentScheduler.processAgentMessages();

        verify(streamOps, never()).add(anyString(), any(Map.class));
    }

    @Test
    void processAgentMessages_skipsWhenClaimNotAcquired() {
        when(agentContextRepository.findDueForDeployedAgents(any(LocalDateTime.class)))
                .thenReturn(List.of(context));
        when(agentContextRepository.claimDueContext(eq(100L), any(LocalDateTime.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(0);

        agentScheduler.processAgentMessages();

        verify(agentContextRepository, never()).findById(100L);
        verify(streamOps, never()).add(anyString(), any(Map.class));
    }

    @SuppressWarnings("unchecked")
    @Test
    void processAgentMessages_continuesAfterFailure() {
        AgentContext context2 = new AgentContext();
        context2.setContextId(101L);
        context2.setAgentId(10L);
        context2.setGoalId(200L);
        context2.setName("Evening Review");
        context2.setMessageType("guidance");
        context2.setDeployed(true);
        context2.setLastMessageSentAt(null);

        when(agentContextRepository.findDueForDeployedAgents(any(LocalDateTime.class)))
                .thenReturn(List.of(context, context2));
        when(agentContextRepository.findById(101L)).thenReturn(Optional.of(context2));
        when(agentRepository.findById(10L)).thenReturn(Optional.of(agent));
        when(userRepository.findById(1L))
                .thenThrow(new RuntimeException("DB error"))
                .thenReturn(Optional.of(user));
        when(checklistRepository.findChecklistItemByGoalId(200L)).thenReturn(List.of());
        when(sentAgentMessageRepository.findTop5ByContextIdOrderBySentAtDesc(anyLong())).thenReturn(List.of());
        when(goalRepository.findById(200L)).thenReturn(Optional.of(goal));

        agentScheduler.processAgentMessages();

        ArgumentCaptor<String> streamCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, String>> fieldsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(streamOps).add(streamCaptor.capture(), fieldsCaptor.capture());
        assertThat(streamCaptor.getValue()).isEqualTo(RedisStreamConfig.STREAM_AGENT_MESSAGES);
        assertThat(fieldsCaptor.getValue().get("key")).isEqualTo("1");
    }

    @Test
    void computeNextMessageAt_usesBaseIntervalForNag() {
        context.setMessageType("nag");
        LocalDateTime now = LocalDateTime.of(2026, 3, 22, 12, 0, 0);

        LocalDateTime next = agentScheduler.computeNextMessageAt(context, List.of(), true, 1, now);

        assertThat(next).isEqualTo(now.plusHours(6));
    }

    @Test
    void computeNextMessageAt_usesBaseIntervalForMotivation() {
        context.setMessageType("motivation");
        LocalDateTime now = LocalDateTime.of(2026, 3, 22, 12, 0, 0);

        LocalDateTime next = agentScheduler.computeNextMessageAt(context, List.of(), true, 1, now);

        assertThat(next).isEqualTo(now.plusHours(24));
    }

    @Test
    void computeNextMessageAt_usesBaseIntervalForGuidance() {
        context.setMessageType("guidance");
        LocalDateTime now = LocalDateTime.of(2026, 3, 22, 12, 0, 0);

        LocalDateTime next = agentScheduler.computeNextMessageAt(context, List.of(), true, 1, now);

        assertThat(next).isEqualTo(now.plusHours(48));
    }

    @Test
    void computeNextMessageAt_acceleratesForHighActivity() {
        context.setMessageType("nag"); // base 6h, modifier 0.5 = 3h
        LocalDateTime now = LocalDateTime.of(2026, 3, 22, 12, 0, 0);

        // 3 recent completions within 2 days
        String today = now.toString();
        ChecklistItem c1 = new ChecklistItem(); c1.setCompleted(true); c1.setCompletedAt(today);
        ChecklistItem c2 = new ChecklistItem(); c2.setCompleted(true); c2.setCompletedAt(today);
        ChecklistItem c3 = new ChecklistItem(); c3.setCompleted(true); c3.setCompletedAt(today);

        LocalDateTime next = agentScheduler.computeNextMessageAt(
                context, List.of(c1, c2, c3), true, 1, now);

        assertThat(next).isEqualTo(now.plusHours(3));
    }

    @Test
    void computeNextMessageAt_backsOffForStaleMessages() {
        context.setMessageType("nag"); // base 6h
        LocalDateTime now = LocalDateTime.of(2026, 3, 22, 12, 0, 0);

        LocalDateTime next = agentScheduler.computeNextMessageAt(context, List.of(), false, 2, now);

        assertThat(next).isEqualTo(now.plusHours(12));
    }

    @Test
    void computeNextMessageAt_capsAtWeekLongInterval() {
        context.setMessageType("nag");
        LocalDateTime now = LocalDateTime.of(2026, 3, 22, 12, 0, 0);

        LocalDateTime next = agentScheduler.computeNextMessageAt(context, List.of(), false, 10, now);

        assertThat(next).isEqualTo(now.plusHours(168));
    }

    @Test
    void computeStaleCountForCurrentSend_resetsWhenChecklistActivityIsNewerThanLastMessage() {
        context.setLastMessageSentAt(LocalDateTime.of(2026, 3, 10, 9, 0));
        context.setLastChecklistActivityAt(LocalDateTime.of(2026, 3, 10, 10, 0));
        context.setStaleCount(6);

        int count = agentScheduler.computeStaleCountForCurrentSend(context);

        assertThat(count).isEqualTo(1);
    }

    @Test
    void computeStaleCountForCurrentSend_usesPersistedStaleCountWhenNoNewActivity() {
        context.setLastMessageSentAt(LocalDateTime.of(2026, 3, 10, 9, 0));
        context.setLastChecklistActivityAt(LocalDateTime.of(2026, 3, 10, 8, 0));
        context.setStaleCount(6);

        int count = agentScheduler.computeStaleCountForCurrentSend(context);

        assertThat(count).isEqualTo(7);
    }

    @Test
    void buildPayload_containsGoalAndUserInfo() {
        when(goalRepository.findById(200L)).thenReturn(Optional.of(goal));
        when(sentAgentMessageRepository.findTop5ByContextIdOrderBySentAtDesc(100L)).thenReturn(List.of());

        AgentMessagePayload payload = agentScheduler.buildPayload(context, agent, user, List.of(item), 7);

        assertThat(payload.getContextId()).isEqualTo(100L);
        assertThat(payload.getUserEmail()).isEqualTo("test@example.com");
        assertThat(payload.getUserName()).isEqualTo("Test User");
        assertThat(payload.getUserProfile()).contains("Career: Engineer");
        assertThat(payload.getAgentName()).isEqualTo("My AI Agent");
        assertThat(payload.getContextName()).isEqualTo("Morning Check");
        assertThat(payload.getMessageType()).isEqualTo("motivation");
        assertThat(payload.getMessagesSinceLastChange()).isEqualTo(7);
        assertThat(payload.getGoal()).isNotNull();
        assertThat(payload.getGoal().getTitle()).isEqualTo("Learn Spanish");
        assertThat(payload.getGoal().getSmartContext()).contains("Specific: Pass B2 exam");
        assertThat(payload.getGoal().getChecklistItems()).hasSize(1);
        assertThat(payload.getGoal().getChecklistItems().get(0).isCompleted()).isTrue();
        assertThat(payload.getConversationHistory()).isEmpty();
        assertThat(payload.getPreviousMessageIds()).isEmpty();
    }

    @Test
    void buildPayload_includesConversationHistory() {
        SentAgentMessage msg = new SentAgentMessage();
        msg.setSentMessageId(500L);
        msg.setContextId(100L);
        msg.setUserId(1L);
        msg.setSubject("Check in");
        msg.setContent("How's progress?");
        msg.setEmailMessageId("<agent-100-123@nagai.app>");
        msg.setSentAt(LocalDateTime.now(ZoneOffset.UTC).minusHours(12));

        when(goalRepository.findById(200L)).thenReturn(Optional.of(goal));
        when(sentAgentMessageRepository.findTop5ByContextIdOrderBySentAtDesc(100L)).thenReturn(List.of(msg));
        when(agentReplyRepository.findBySentMessageIdIn(List.of(500L))).thenReturn(List.of());

        AgentMessagePayload payload = agentScheduler.buildPayload(context, agent, user, List.of(item), 0);

        assertThat(payload.getConversationHistory()).hasSize(1);
        assertThat(payload.getConversationHistory().get(0).getRole()).isEqualTo("agent");
        assertThat(payload.getConversationHistory().get(0).getContent()).isEqualTo("How's progress?");
        assertThat(payload.getPreviousMessageIds()).containsExactly("<agent-100-123@nagai.app>");
        assertThat(payload.getPreviousSubjects()).containsExactly("Check in");
    }

    @SuppressWarnings("unchecked")
    @Test
    void processAgentMessages_autoPausesContextWhenStaleThresholdReached() {
        context.setMessageType("nag");
        context.setStaleCount(9);

        when(agentContextRepository.findDueForDeployedAgents(any(LocalDateTime.class)))
                .thenReturn(List.of(context));
        when(agentRepository.findById(10L)).thenReturn(Optional.of(agent));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(checklistRepository.findChecklistItemByGoalId(200L)).thenReturn(List.of());
        when(sentAgentMessageRepository.findTop5ByContextIdOrderBySentAtDesc(100L)).thenReturn(List.of());
        when(goalRepository.findById(200L)).thenReturn(Optional.of(goal));
        when(agentRepository.save(any(Agent.class))).thenAnswer(inv -> inv.getArgument(0));

        agentScheduler.processAgentMessages();

        verify(streamOps).add(anyString(), any(Map.class));
        verify(taskScheduler, never()).schedule(any(Runnable.class), any(Instant.class));
        assertThat(context.isDeployed()).isFalse();
        assertThat(context.getPauseReason()).isEqualTo(AgentCadence.PAUSE_REASON_STALE_PROGRESS);
        assertThat(context.getNextMessageAt()).isNull();
        assertThat(context.getStaleCount()).isEqualTo(10);
    }
}
