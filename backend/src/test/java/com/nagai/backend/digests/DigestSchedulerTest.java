package com.nagai.backend.digests;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.TaskScheduler;

import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.config.KafkaConfig;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;

import io.micrometer.core.instrument.Counter;

@ExtendWith(MockitoExtension.class)
class DigestSchedulerTest {

    @Mock private DigestRepository digestRepository;
    @Mock private DigestService digestService;
    @Mock private GoalRepository goalRepository;
    @Mock private ChecklistRepository checklistRepository;
    @Mock private UserRepository userRepository;
    @Mock private SentDigestRepository sentDigestRepository;
    @Mock private KafkaTemplate<String, String> kafkaTemplate;
    @Mock private TaskScheduler taskScheduler;
    @Mock private Counter digestsSentCounter;
    @Mock private Counter digestsFailedCounter;

    private DigestScheduler digestScheduler;

    private User user;
    private Digest digest;
    private Goal goal;
    private ChecklistItem item;

    @BeforeEach
    void setUp() {
        digestScheduler = new DigestScheduler(
                digestRepository, digestService, goalRepository,
                checklistRepository, userRepository, sentDigestRepository,
                kafkaTemplate, taskScheduler, digestsSentCounter, digestsFailedCounter);

        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");
        user.setFullName("Test User");
        user.setUserLocation("New York");
        user.setTimezone("America/New_York");
        user.setCareer("Engineer");

        digest = new Digest();
        digest.setDigestId(10L);
        digest.setUserId(1L);
        digest.setFrequency("daily");
        digest.setDeliveryTime("morning");
        digest.setContentTypes(new String[]{"tips", "progress_insights"});
        digest.setActive(true);
        digest.setNextDeliveryAt(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(5));

        goal = new Goal();
        goal.setGoalId(100L);
        goal.setUserId(1L);
        goal.setTitle("Learn Spanish");
        goal.setDescription("Become conversational");
        goal.setSpecific("Pass B2 exam");

        item = new ChecklistItem();
        item.setChecklistId(1000L);
        item.setGoalId(100L);
        item.setTitle("Buy textbook");
        item.setCompleted(true);
        item.setCompletedAt("2026-03-10");
    }

    @Test
    void processDigests_publishesToKafkaForDueDigests() {
        when(digestRepository.findByActiveAndNextDeliveryAtBefore(eq(true), any(LocalDateTime.class)))
                .thenReturn(List.of(digest));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(goalRepository.findAllByUserId(1L)).thenReturn(List.of(goal));
        when(checklistRepository.findChecklistItemByGoalId(100L)).thenReturn(List.of(item));
        when(sentDigestRepository.findTop3ByUserIdOrderBySentAtDesc(1L)).thenReturn(List.of());
        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(null));

        digestScheduler.processDigests();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<ProducerRecord<String, String>> recordCaptor =
                ArgumentCaptor.forClass(ProducerRecord.class);

        verify(kafkaTemplate).send(recordCaptor.capture());
        ProducerRecord<String, String> record = recordCaptor.getValue();
        assertThat(record.topic()).isEqualTo(KafkaConfig.TOPIC_DIGEST_DELIVERY);
        assertThat(record.key()).isEqualTo("1");
        assertThat(record.value()).contains("Learn Spanish");
        assertThat(record.value()).contains("test@example.com");
        assertThat(record.value()).contains("Buy textbook");
        assertThat(record.headers().lastHeader("x-correlation-id")).isNotNull();

        verify(digestService).markDelivered(digest, user);
    }

    @Test
    void processDigests_skipsWhenUserNotFound() {
        when(digestRepository.findByActiveAndNextDeliveryAtBefore(eq(true), any(LocalDateTime.class)))
                .thenReturn(List.of(digest));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        digestScheduler.processDigests();

        verify(kafkaTemplate, never()).send(any(ProducerRecord.class));
        verify(digestService, never()).markDelivered(any(), any());
    }

    @Test
    void processDigests_continuesAfterFailure() {
        Digest digest2 = new Digest();
        digest2.setDigestId(20L);
        digest2.setUserId(2L);
        digest2.setContentTypes(new String[]{"tips"});

        User user2 = new User();
        user2.setUserId(2L);
        user2.setEmail("user2@example.com");
        user2.setFullName("User Two");

        when(digestRepository.findByActiveAndNextDeliveryAtBefore(eq(true), any(LocalDateTime.class)))
                .thenReturn(List.of(digest, digest2));
        when(userRepository.findById(1L)).thenThrow(new RuntimeException("DB error"));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user2));
        when(goalRepository.findAllByUserId(2L)).thenReturn(List.of());
        when(sentDigestRepository.findTop3ByUserIdOrderBySentAtDesc(2L)).thenReturn(List.of());
        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(null));

        digestScheduler.processDigests();

        // Should still process digest2 despite digest1 failing
        @SuppressWarnings("unchecked")
        ArgumentCaptor<ProducerRecord<String, String>> captor = ArgumentCaptor.forClass(ProducerRecord.class);
        verify(kafkaTemplate).send(captor.capture());
        assertThat(captor.getValue().topic()).isEqualTo(KafkaConfig.TOPIC_DIGEST_DELIVERY);
        assertThat(captor.getValue().key()).isEqualTo("2");
    }

    @Test
    void processDigests_nothingDue() {
        when(digestRepository.findByActiveAndNextDeliveryAtBefore(eq(true), any(LocalDateTime.class)))
                .thenReturn(List.of());

        digestScheduler.processDigests();

        verifyNoInteractions(kafkaTemplate);
        verifyNoInteractions(digestService);
    }

    @Test
    void buildPayload_containsAllFields() {
        when(goalRepository.findAllByUserId(1L)).thenReturn(List.of(goal));
        when(checklistRepository.findChecklistItemByGoalId(100L)).thenReturn(List.of(item));
        when(sentDigestRepository.findTop3ByUserIdOrderBySentAtDesc(1L)).thenReturn(List.of());

        DigestDeliveryPayload payload = digestScheduler.buildPayload(digest, user, true);

        assertThat(payload.getDigestId()).isEqualTo(10L);
        assertThat(payload.getUserEmail()).isEqualTo("test@example.com");
        assertThat(payload.getUserName()).isEqualTo("Test User");
        assertThat(payload.getUserLocation()).isEqualTo("New York");
        assertThat(payload.getUserProfile()).contains("Career: Engineer");
        assertThat(payload.getContentTypes()).containsExactly("tips", "progress_insights");
        assertThat(payload.isProgressSinceLastDelivery()).isTrue();
        assertThat(payload.getGoals()).hasSize(1);
        assertThat(payload.getGoals().get(0).getTitle()).isEqualTo("Learn Spanish");
        assertThat(payload.getGoals().get(0).getSmartContext()).contains("Specific: Pass B2 exam");
        assertThat(payload.getGoals().get(0).getChecklistItems()).hasSize(1);
        assertThat(payload.getGoals().get(0).getChecklistItems().get(0).isCompleted()).isTrue();
    }
}
