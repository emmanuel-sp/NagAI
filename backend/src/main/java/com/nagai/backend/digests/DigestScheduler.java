package com.nagai.backend.digests;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
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
public class DigestScheduler {

    private static final Logger log = LoggerFactory.getLogger(DigestScheduler.class);

    /** Auto-pause digest after this many consecutive stale deliveries. */
    static final int STALE_PAUSE_THRESHOLD = 5;

    private final DigestRepository digestRepository;
    private final DigestService digestService;
    private final GoalRepository goalRepository;
    private final ChecklistRepository checklistRepository;
    private final UserRepository userRepository;
    private final SentDigestRepository sentDigestRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final Counter digestsSentCounter;
    private final Counter digestsFailedCounter;

    public DigestScheduler(DigestRepository digestRepository, DigestService digestService,
                           GoalRepository goalRepository, ChecklistRepository checklistRepository,
                           UserRepository userRepository, SentDigestRepository sentDigestRepository,
                           KafkaTemplate<String, String> kafkaTemplate,
                           Counter digestsSentCounter, Counter digestsFailedCounter) {
        this.digestRepository = digestRepository;
        this.digestService = digestService;
        this.goalRepository = goalRepository;
        this.checklistRepository = checklistRepository;
        this.userRepository = userRepository;
        this.sentDigestRepository = sentDigestRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.digestsSentCounter = digestsSentCounter;
        this.digestsFailedCounter = digestsFailedCounter;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processDigests() {
        String correlationId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("correlationId", correlationId);

        try {
            processDigestsInternal(correlationId);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void processDigestsInternal(String correlationId) {
        List<Digest> dueDigests = digestRepository.findByActiveAndNextDeliveryAtBefore(
                true, LocalDateTime.now(ZoneOffset.UTC));

        if (dueDigests.isEmpty()) {
            log.debug("No due digests found");
            return;
        }

        log.info("Found {} due digest(s) to process", dueDigests.size());

        for (Digest digest : dueDigests) {
            try {
                User user = userRepository.findById(digest.getUserId())
                        .orElse(null);
                if (user == null) {
                    log.warn("User {} not found for digest {}", digest.getUserId(), digest.getDigestId());
                    continue;
                }

                // Detect whether any progress was made since last delivery
                boolean hasProgress = hasProgressSinceLastDelivery(digest);
                if (hasProgress) {
                    digest.setStaleCount(0);
                } else {
                    digest.setStaleCount(digest.getStaleCount() + 1);
                }

                // Auto-pause after too many stale deliveries
                if (digest.getStaleCount() >= STALE_PAUSE_THRESHOLD) {
                    log.info("Auto-pausing digest {} for user {} — {} consecutive stale deliveries",
                            digest.getDigestId(), user.getUserId(), digest.getStaleCount());
                    digest.setActive(false);
                    digest.setNextDeliveryAt(null);
                    digest.setPauseReason("stale_progress");
                    digestRepository.save(digest);
                    continue;
                }

                DigestDeliveryPayload payload = buildPayload(digest, user, hasProgress);
                String json = objectMapper.writeValueAsString(payload);
                log.info("Publishing digest {} for user {} (email={}, staleCount={}) to Kafka...",
                        digest.getDigestId(), user.getUserId(), user.getEmail(), digest.getStaleCount());

                ProducerRecord<String, String> record = new ProducerRecord<>(
                        KafkaConfig.TOPIC_DIGEST_DELIVERY, String.valueOf(user.getUserId()), json);
                record.headers().add("x-correlation-id", correlationId.getBytes(StandardCharsets.UTF_8));
                kafkaTemplate.send(record).get(10, java.util.concurrent.TimeUnit.SECONDS);

                log.info("Kafka publish succeeded for digest {}", digest.getDigestId());
                digestService.markDelivered(digest, user);
                digestsSentCounter.increment();
                log.info("Digest {} delivered and next delivery scheduled", digest.getDigestId());
            } catch (Exception e) {
                digestsFailedCounter.increment();
                log.error("Failed to process digest {}: {}", digest.getDigestId(), e.getMessage(), e);
            }
        }
    }

    boolean hasProgressSinceLastDelivery(Digest digest) {
        LocalDateTime since = digest.getLastDeliveredAt();
        if (since == null) {
            return true; // first delivery — treat as fresh
        }

        String sinceStr = since.toLocalDate().toString(); // YYYY-MM-DD
        List<Goal> goals = goalRepository.findAllByUserId(digest.getUserId());

        for (Goal goal : goals) {
            List<ChecklistItem> items = checklistRepository.findChecklistItemByGoalId(goal.getGoalId());
            for (ChecklistItem item : items) {
                if (item.isCompleted() && item.getCompletedAt() != null
                        && item.getCompletedAt().compareTo(sinceStr) > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    DigestDeliveryPayload buildPayload(Digest digest, User user, boolean hasProgress) {
        List<Goal> goals = goalRepository.findAllByUserId(user.getUserId());

        List<DigestDeliveryPayload.GoalPayload> goalPayloads = goals.stream()
                .map(goal -> {
                    List<ChecklistItem> items = checklistRepository.findChecklistItemByGoalId(goal.getGoalId());
                    List<DigestDeliveryPayload.ChecklistItemPayload> itemPayloads = items.stream()
                            .map(item -> DigestDeliveryPayload.ChecklistItemPayload.builder()
                                    .title(item.getTitle())
                                    .completed(item.isCompleted())
                                    .completedAt(item.getCompletedAt())
                                    .deadline(item.getDeadline())
                                    .build())
                            .collect(Collectors.toList());

                    return DigestDeliveryPayload.GoalPayload.builder()
                            .title(goal.getTitle())
                            .description(goal.getDescription())
                            .smartContext(ProfileUtils.buildGoalSmartContext(goal))
                            .checklistItems(itemPayloads)
                            .build();
                })
                .collect(Collectors.toList());

        List<String> previousSubjects = sentDigestRepository
                .findTop3ByUserIdOrderBySentAtDesc(user.getUserId()).stream()
                .map(SentDigest::getSubject)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toList());

        return DigestDeliveryPayload.builder()
                .digestId(digest.getDigestId())
                .userId(user.getUserId())
                .userEmail(user.getEmail())
                .userName(user.getFullName())
                .userLocation(user.getUserLocation())
                .userProfile(ProfileUtils.buildUserProfile(user))
                .contentTypes(digest.getContentTypes())
                .lastDeliveredAt(digest.getLastDeliveredAt() != null
                        ? digest.getLastDeliveredAt().toString() : null)
                .unsubscribeToken(digest.getUnsubscribeToken())
                .goals(goalPayloads)
                .previousSubjects(previousSubjects)
                .staleCount(digest.getStaleCount())
                .progressSinceLastDelivery(hasProgress)
                .build();
    }

}
