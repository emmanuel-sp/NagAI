package com.nagai.backend.digests;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
public class DigestScheduler {

    private static final Logger log = LoggerFactory.getLogger(DigestScheduler.class);

    /** Auto-pause digest after this many consecutive stale deliveries. */
    static final int STALE_PAUSE_THRESHOLD = 5;
    private static final Duration CLAIM_TTL = Duration.ofMinutes(15);

    private final DigestRepository digestRepository;
    private final DigestService digestService;
    private final GoalRepository goalRepository;
    private final ChecklistRepository checklistRepository;
    private final UserRepository userRepository;
    private final SentDigestRepository sentDigestRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final TaskScheduler taskScheduler;
    private final Counter digestsSentCounter;
    private final Counter digestsFailedCounter;

    private final Map<Long, ScheduledFuture<?>> timers = new ConcurrentHashMap<>();

    public DigestScheduler(DigestRepository digestRepository, DigestService digestService,
                           GoalRepository goalRepository, ChecklistRepository checklistRepository,
                           UserRepository userRepository, SentDigestRepository sentDigestRepository,
                           StringRedisTemplate redisTemplate, TaskScheduler taskScheduler,
                           Counter digestsSentCounter, Counter digestsFailedCounter) {
        this.digestRepository = digestRepository;
        this.digestService = digestService;
        this.goalRepository = goalRepository;
        this.checklistRepository = checklistRepository;
        this.userRepository = userRepository;
        this.sentDigestRepository = sentDigestRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.taskScheduler = taskScheduler;
        this.digestsSentCounter = digestsSentCounter;
        this.digestsFailedCounter = digestsFailedCounter;
    }

    /**
     * Safety sweep — catches missed timers, newly created digests, and startup recovery.
     * Runs every 5 minutes instead of the old 60-second poll.
     */
    @Scheduled(fixedRate = 300_000, initialDelay = 30_000)
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
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        List<Digest> dueDigests = digestRepository.findByActiveAndNextDeliveryAtBefore(
                true, now);

        if (dueDigests.isEmpty()) {
            log.debug("Sweep: no due digests found");
            return;
        }

        log.info("Found {} due digest(s) to process", dueDigests.size());

        for (Digest digest : dueDigests) {
            processDigestById(digest.getDigestId(), correlationId, now);
        }
    }

    /** Timer entry point — fired at the exact scheduled delivery time. */
    void onDigestTimerFired(Long digestId) {
        timers.remove(digestId);
        String correlationId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("correlationId", correlationId);

        try {
            log.info("Timer: processing digest {}", digestId);
            processDigestById(digestId, correlationId, LocalDateTime.now(ZoneOffset.UTC));
        } catch (Exception e) {
            digestsFailedCounter.increment();
            log.error("Timer: failed to process digest {}: {}", digestId, e.getMessage(), e);
        } finally {
            MDC.remove("correlationId");
        }
    }

    private void processDigestById(Long digestId, String correlationId, LocalDateTime now) {
        if (!claimDigest(digestId, now)) {
            return;
        }

        Digest digest = digestRepository.findById(digestId).orElse(null);
        if (digest == null || !digest.isActive()) {
            digestRepository.clearProcessingClaim(digestId);
            return;
        }
        if (digest.getNextDeliveryAt() == null || digest.getNextDeliveryAt().isAfter(now)) {
            digestRepository.clearProcessingClaim(digestId);
            return;
        }

        processDigest(digest, correlationId);
    }

    private boolean claimDigest(Long digestId, LocalDateTime now) {
        return digestRepository.claimDueDigest(
                digestId,
                now,
                now,
                now.minus(CLAIM_TTL)
        ) == 1;
    }

    private void processDigest(Digest digest, String correlationId) {
        try {
            User user = userRepository.findById(digest.getUserId())
                    .orElse(null);
            if (user == null) {
                log.warn("User {} not found for digest {}", digest.getUserId(), digest.getDigestId());
                digestRepository.clearProcessingClaim(digest.getDigestId());
                return;
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
                digest.setProcessingStartedAt(null);
                digestRepository.save(digest);
                cancelTimer(digest.getDigestId());
                return;
            }

            DigestDeliveryPayload payload = buildPayload(digest, user, hasProgress);
            String json = objectMapper.writeValueAsString(payload);
            log.info("Publishing digest {} for user {} (email={}, staleCount={}) to Redis stream...",
                    digest.getDigestId(), user.getUserId(), user.getEmail(), digest.getStaleCount());

            Map<String, String> fields = Map.of(
                    "key", String.valueOf(user.getUserId()),
                    "correlationId", correlationId,
                    "payload", json);
            redisTemplate.opsForStream().add(RedisStreamConfig.STREAM_DIGEST_DELIVERY, fields);

            log.info("Redis publish succeeded for digest {}", digest.getDigestId());
            digestService.markDelivered(digest, user);
            digestsSentCounter.increment();

            // Schedule a precise timer for the next delivery
            scheduleTimer(digest.getDigestId(), digest.getNextDeliveryAt());
            log.info("Digest {} delivered, next at {}", digest.getDigestId(), digest.getNextDeliveryAt());
        } catch (Exception e) {
            digestRepository.clearProcessingClaim(digest.getDigestId());
            digestsFailedCounter.increment();
            log.error("Failed to process digest {}: {}", digest.getDigestId(), e.getMessage(), e);
        }
    }

    void scheduleTimer(Long digestId, LocalDateTime nextDeliveryAt) {
        cancelTimer(digestId);
        if (nextDeliveryAt == null) return;
        Instant fireAt = nextDeliveryAt.toInstant(ZoneOffset.UTC);
        if (!fireAt.isAfter(Instant.now())) return;

        ScheduledFuture<?> future = taskScheduler.schedule(
                () -> onDigestTimerFired(digestId), fireAt);
        if (future != null) {
            timers.put(digestId, future);
        }
        log.debug("Scheduled timer for digest {} at {}", digestId, nextDeliveryAt);
    }

    private void cancelTimer(Long digestId) {
        ScheduledFuture<?> existing = timers.remove(digestId);
        if (existing != null) existing.cancel(false);
    }

    boolean hasProgressSinceLastDelivery(Digest digest) {
        LocalDateTime since = digest.getLastDeliveredAt();
        if (since == null) {
            return true; // first delivery — treat as fresh
        }

        List<Goal> goals = goalRepository.findAllByUserId(digest.getUserId());
        Map<Long, List<ChecklistItem>> checklistItemsByGoalId = loadChecklistItemsByGoalId(goals);

        for (Goal goal : goals) {
            List<ChecklistItem> items = checklistItemsByGoalId.getOrDefault(goal.getGoalId(), List.of());
            for (ChecklistItem item : items) {
                if (item.isCompleted() && ChecklistTimestampUtils.isCompletedAfter(item.getCompletedAt(), since)) {
                    return true;
                }
            }
        }
        return false;
    }

    DigestDeliveryPayload buildPayload(Digest digest, User user, boolean hasProgress) {
        List<Goal> goals = goalRepository.findAllByUserId(user.getUserId());
        Map<Long, List<ChecklistItem>> checklistItemsByGoalId = loadChecklistItemsByGoalId(goals);

        List<DigestDeliveryPayload.GoalPayload> goalPayloads = goals.stream()
                .map(goal -> {
                    List<ChecklistItem> items = checklistItemsByGoalId.getOrDefault(goal.getGoalId(), List.of());
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

    private Map<Long, List<ChecklistItem>> loadChecklistItemsByGoalId(List<Goal> goals) {
        List<Long> goalIds = goals.stream()
                .map(Goal::getGoalId)
                .toList();
        if (goalIds.isEmpty()) {
            return Map.of();
        }

        return checklistRepository.findChecklistItemsByGoalIds(goalIds).stream()
                .collect(Collectors.groupingBy(
                        ChecklistItem::getGoalId,
                        java.util.LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

}
