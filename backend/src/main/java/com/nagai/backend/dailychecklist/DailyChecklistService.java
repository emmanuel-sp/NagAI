package com.nagai.backend.dailychecklist;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nagai.ai.DailyChecklistCandidate;
import com.nagai.ai.DailyChecklistItemSuggestion;
import com.nagai.ai.DailyChecklistResponse;
import com.nagai.backend.ai.AiGrpcClientService;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.common.ProfileUtils;
import com.nagai.backend.config.RedisStreamConfig;
import com.nagai.backend.exceptions.DailyChecklistAlreadyExistsException;
import com.nagai.backend.exceptions.DailyChecklistException;
import com.nagai.backend.exceptions.DailyChecklistItemNotFoundException;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.goals.GoalService;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@Service
public class DailyChecklistService {

    private static final Logger log = LoggerFactory.getLogger(DailyChecklistService.class);
    private static final Pattern GOAL_LABEL = Pattern.compile("\\[G(\\d+)-(\\d+)]");
    private static final Pattern GOAL_TAG = Pattern.compile("\\[G(\\d+)]");
    private static final ObjectMapper mapper = new ObjectMapper();

    private final DailyChecklistConfigRepository configRepository;
    private final DailyChecklistRepository dailyChecklistRepository;
    private final DailyChecklistItemRepository dailyItemRepository;
    private final ChecklistRepository checklistRepository;
    private final GoalRepository goalRepository;
    private final GoalService goalService;
    private final UserService userService;
    private final AiGrpcClientService aiGrpcClientService;
    private final StringRedisTemplate redisTemplate;

    public DailyChecklistService(
            DailyChecklistConfigRepository configRepository,
            DailyChecklistRepository dailyChecklistRepository,
            DailyChecklistItemRepository dailyItemRepository,
            ChecklistRepository checklistRepository,
            GoalRepository goalRepository,
            GoalService goalService,
            UserService userService,
            AiGrpcClientService aiGrpcClientService,
            StringRedisTemplate redisTemplate) {
        this.configRepository = configRepository;
        this.dailyChecklistRepository = dailyChecklistRepository;
        this.dailyItemRepository = dailyItemRepository;
        this.checklistRepository = checklistRepository;
        this.goalRepository = goalRepository;
        this.goalService = goalService;
        this.userService = userService;
        this.aiGrpcClientService = aiGrpcClientService;
        this.redisTemplate = redisTemplate;
    }

    // ---- Config ----

    public DailyChecklistConfigResponse getConfig() {
        User user = userService.getCurrentUser();
        DailyChecklistConfig config = configRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultConfig(user.getUserId()));
        return DailyChecklistConfigResponse.fromEntity(config);
    }

    public DailyChecklistConfigResponse updateConfig(DailyChecklistConfigRequest request) {
        User user = userService.getCurrentUser();
        DailyChecklistConfig config = configRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultConfig(user.getUserId()));

        if (request.maxItems() != null) {
            config.setMaxItems(Math.max(1, Math.min(12, request.maxItems())));
        }
        if (request.recurringItems() != null) {
            config.setRecurringItems(toJson(request.recurringItems()));
        }
        // null means "all goals" — explicitly pass empty list to clear selection
        config.setIncludedGoalIds(request.includedGoalIds() != null
                ? toJson(request.includedGoalIds()) : null);
        config.setUpdatedAt(LocalDateTime.now());

        return DailyChecklistConfigResponse.fromEntity(configRepository.save(config));
    }

    private DailyChecklistConfig createDefaultConfig(Long userId) {
        DailyChecklistConfig config = new DailyChecklistConfig();
        config.setUserId(userId);
        config.setMaxItems(10);
        return configRepository.save(config);
    }

    // ---- Daily Checklist ----

    public com.nagai.backend.dailychecklist.DailyChecklistResponse getTodayChecklist() {
        User user = userService.getCurrentUser();
        LocalDate today = todayInUserTimezone(user);
        return dailyChecklistRepository.findByUserIdAndPlanDate(user.getUserId(), today)
                .map(dc -> buildResponse(dc, user))
                .orElse(null);
    }

    public com.nagai.backend.dailychecklist.DailyChecklistResponse generateDailyChecklist() {
        User user = userService.getCurrentUser();
        ZoneId zone = ZoneId.of(user.getTimezone() != null ? user.getTimezone() : "UTC");
        LocalDate today = LocalDate.now(zone);
        LocalTime nowTime = LocalTime.now(zone);

        // 409 if already exists
        if (dailyChecklistRepository.findByUserIdAndPlanDate(user.getUserId(), today).isPresent()) {
            throw new DailyChecklistAlreadyExistsException();
        }

        // Load config
        DailyChecklistConfig config = configRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultConfig(user.getUserId()));

        List<String> recurringItems = parseJson(config.getRecurringItems(), new TypeReference<>() {});
        List<Long> includedGoalIds = parseJson(config.getIncludedGoalIds(), new TypeReference<>() {});
        if (recurringItems == null) recurringItems = List.of();

        // Load goals and their checklist items
        List<Goal> goals = goalService.getAllGoals();
        if (includedGoalIds != null && !includedGoalIds.isEmpty()) {
            List<Long> selected = includedGoalIds;
            goals = goals.stream()
                    .filter(g -> selected.contains(g.getGoalId()))
                    .toList();
        }

        // Build labeled candidates
        List<DailyChecklistCandidate> candidates = new ArrayList<>();
        for (Goal goal : goals) {
            List<ChecklistItem> items = checklistRepository.findChecklistItemByGoalId(goal.getGoalId());
            String smartContext = ProfileUtils.buildGoalSmartContext(goal);
            for (ChecklistItem item : items) {
                String label = "[G" + goal.getGoalId() + "-" + item.getChecklistId() + "]";
                candidates.add(DailyChecklistCandidate.newBuilder()
                        .setLabel(label)
                        .setTitle(item.getTitle())
                        .setNotes(item.getNotes() != null ? item.getNotes() : "")
                        .setCompleted(item.isCompleted())
                        .setGoalTitle(goal.getTitle())
                        .setGoalSmartContext(smartContext)
                        .build());
            }
        }

        // Call AI
        String currentTime = nowTime.format(DateTimeFormatter.ofPattern("HH:mm"));
        String dayOfWeek = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String planDate = today.toString();
        String userProfile = ProfileUtils.buildUserProfile(user);

        DailyChecklistResponse aiResponse = aiGrpcClientService.generateDailyChecklist(
                candidates, recurringItems, config.getMaxItems(),
                currentTime, userProfile, dayOfWeek, planDate);

        // Persist daily checklist
        DailyChecklist checklist = new DailyChecklist();
        checklist.setUserId(user.getUserId());
        checklist.setPlanDate(today);
        checklist = dailyChecklistRepository.save(checklist);

        // Validate AI returned usable items
        if (aiResponse.getItemsList().isEmpty()) {
            throw new DailyChecklistException(
                    "Not enough context to generate a daily plan. "
                    + "Try adding more details to your profile, creating goals with checklist items, "
                    + "or configuring recurring anchors in the daily plan settings.");
        }

        // Parse AI response and create items
        List<DailyChecklistItem> items = new ArrayList<>();
        int sortOrder = 0;
        for (DailyChecklistItemSuggestion suggestion : aiResponse.getItemsList()) {
            DailyChecklistItem item = new DailyChecklistItem();
            item.setDailyChecklistId(checklist.getDailyChecklistId());
            item.setTitle(suggestion.getTitle());
            item.setNotes(suggestion.getNotes().isEmpty() ? null : suggestion.getNotes());
            item.setScheduledTime(suggestion.getScheduledTime().isEmpty()
                    ? null : suggestion.getScheduledTime());
            item.setSortOrder(sortOrder++);
            item.setCompleted(false);

            // Resolve parent link and goal tag from label
            Matcher fullLink = GOAL_LABEL.matcher(suggestion.getLabel());
            Matcher goalOnly = GOAL_TAG.matcher(suggestion.getLabel());
            if (fullLink.matches()) {
                Long goalId = Long.parseLong(fullLink.group(1));
                Long checklistId = Long.parseLong(fullLink.group(2));
                if (checklistRepository.existsById(checklistId)) {
                    item.setParentChecklistId(checklistId);
                    item.setParentGoalId(goalId);
                }
            } else if (goalOnly.matches()) {
                Long goalId = Long.parseLong(goalOnly.group(1));
                if (goalRepository.existsById(goalId)) {
                    item.setParentGoalId(goalId);
                }
            }

            items.add(dailyItemRepository.save(item));
        }

        // Publish Redis event
        publishGeneratedEvent(user.getUserId(), planDate, items.size());

        log.info("Generated daily checklist for user={} date={} items={}",
                user.getUserId(), planDate, items.size());

        return buildResponse(checklist, user);
    }

    // ---- Toggle with write-through ----

    public DailyChecklistItemResponse toggleDailyItem(Long dailyItemId) {
        User user = userService.getCurrentUser();
        DailyChecklistItem dailyItem = dailyItemRepository.findById(dailyItemId)
                .orElseThrow(() -> new DailyChecklistItemNotFoundException());

        // Ownership check
        DailyChecklist checklist = dailyChecklistRepository.findById(dailyItem.getDailyChecklistId())
                .orElseThrow(() -> new DailyChecklistItemNotFoundException());
        if (!checklist.getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("You do not have permission to modify this item");
        }

        // Toggle daily item
        boolean newState = !dailyItem.isCompleted();
        dailyItem.setCompleted(newState);
        dailyItem.setCompletedAt(newState ? LocalDateTime.now().toString() : null);
        dailyItem = dailyItemRepository.save(dailyItem);

        // Write-through to parent
        Long parentId = dailyItem.getParentChecklistId();
        Long itemId = dailyItem.getDailyItemId();
        if (parentId != null) {
            checklistRepository.findById(parentId).ifPresent(parent -> {
                if (newState) {
                    parent.setCompleted(true);
                    parent.setCompletedAt(LocalDateTime.now().toString());
                } else {
                    long othersCompleted = dailyItemRepository
                            .countByParentChecklistIdAndCompletedAndDailyItemIdNot(
                                    parentId, true, itemId);
                    if (othersCompleted == 0) {
                        parent.setCompleted(false);
                        parent.setCompletedAt(null);
                    }
                }
                checklistRepository.save(parent);
            });
        }

        return resolveItemResponse(dailyItem);
    }

    // ---- Delete ----

    public void deleteDailyItem(Long dailyItemId) {
        User user = userService.getCurrentUser();
        DailyChecklistItem dailyItem = dailyItemRepository.findById(dailyItemId)
                .orElseThrow(() -> new DailyChecklistItemNotFoundException());

        DailyChecklist checklist = dailyChecklistRepository.findById(dailyItem.getDailyChecklistId())
                .orElseThrow(() -> new DailyChecklistItemNotFoundException());
        if (!checklist.getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("You do not have permission to delete this item");
        }

        dailyItemRepository.delete(dailyItem);
    }

    // ---- Helpers ----

    private com.nagai.backend.dailychecklist.DailyChecklistResponse buildResponse(
            DailyChecklist checklist, User user) {
        List<DailyChecklistItem> items = dailyItemRepository
                .findByDailyChecklistIdOrderBySortOrder(checklist.getDailyChecklistId());
        List<DailyChecklistItemResponse> itemResponses = items.stream()
                .map(this::resolveItemResponse)
                .toList();
        return new com.nagai.backend.dailychecklist.DailyChecklistResponse(
                checklist.getDailyChecklistId(),
                checklist.getPlanDate().toString(),
                checklist.getGeneratedAt() != null ? checklist.getGeneratedAt().toString() : null,
                itemResponses);
    }

    private DailyChecklistItemResponse resolveItemResponse(DailyChecklistItem item) {
        String parentGoalTitle = null;
        if (item.getParentGoalId() != null) {
            try {
                Goal goal = goalService.getGoal(item.getParentGoalId());
                parentGoalTitle = goal.getTitle();
            } catch (Exception e) {
                // Goal may have been deleted
            }
        }
        return DailyChecklistItemResponse.fromEntity(item, parentGoalTitle);
    }

    private LocalDate todayInUserTimezone(User user) {
        String tz = user.getTimezone() != null ? user.getTimezone() : "UTC";
        return LocalDate.now(ZoneId.of(tz));
    }

    private void publishGeneratedEvent(Long userId, String planDate, int itemCount) {
        try {
            String correlationId = MDC.get("correlationId");
            String payload = mapper.writeValueAsString(Map.of(
                    "event", "daily_checklist_generated",
                    "userId", userId,
                    "planDate", planDate,
                    "itemCount", itemCount));
            Map<String, String> fields = Map.of(
                    "key", String.valueOf(userId),
                    "correlationId", correlationId != null ? correlationId : "",
                    "payload", payload);
            redisTemplate.opsForStream().add(RedisStreamConfig.STREAM_USER_EVENTS, fields);
        } catch (Exception e) {
            log.warn("Failed to publish daily_checklist_generated event: {}", e.getMessage());
        }
    }

    private String toJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private <T> T parseJson(String json, TypeReference<T> ref) {
        if (json == null || json.isBlank()) return null;
        try {
            return mapper.readValue(json, ref);
        } catch (Exception e) {
            return null;
        }
    }
}
