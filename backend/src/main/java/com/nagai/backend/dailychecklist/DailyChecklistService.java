package com.nagai.backend.dailychecklist;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
import com.nagai.ai.CalendarBusyBlock;
import com.nagai.ai.DailyChecklistCandidate;
import com.nagai.ai.DailyChecklistItemSuggestion;
import com.nagai.ai.DailyChecklistResponse;
import com.nagai.backend.ai.AiGrpcClientService;
import com.nagai.backend.calendar.GoogleCalendarService;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.common.ProfileUtils;
import com.nagai.backend.config.RedisStreamConfig;
import com.nagai.backend.exceptions.DailyChecklistRegenerationLimitException;
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
    private static final Pattern NEXT_DAY_PATTERN = Pattern.compile(
            "\\b(tomorrow|next\\s+day|next-day|following\\s+day|following-day)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("\\b\\d{4}-\\d{2}-\\d{2}\\b");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
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
    private final GoogleCalendarService googleCalendarService;

    public DailyChecklistService(
            DailyChecklistConfigRepository configRepository,
            DailyChecklistRepository dailyChecklistRepository,
            DailyChecklistItemRepository dailyItemRepository,
            ChecklistRepository checklistRepository,
            GoalRepository goalRepository,
            GoalService goalService,
            UserService userService,
            AiGrpcClientService aiGrpcClientService,
            StringRedisTemplate redisTemplate,
            GoogleCalendarService googleCalendarService) {
        this.configRepository = configRepository;
        this.dailyChecklistRepository = dailyChecklistRepository;
        this.dailyItemRepository = dailyItemRepository;
        this.checklistRepository = checklistRepository;
        this.goalRepository = goalRepository;
        this.goalService = goalService;
        this.userService = userService;
        this.aiGrpcClientService = aiGrpcClientService;
        this.redisTemplate = redisTemplate;
        this.googleCalendarService = googleCalendarService;
    }

    // ---- Config ----

    public DailyChecklistConfigResponse getConfig() {
        User user = userService.getCurrentUser();
        DailyChecklistConfig config = configRepository.findByUserId(user.getUserId())
                .orElseGet(() -> createDefaultConfig(user.getUserId()));
        return DailyChecklistConfigResponse.fromEntity(config, user);
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
        if (request.calendarEnabled() != null) {
            config.setCalendarEnabled(request.calendarEnabled());
        }
        config.setUpdatedAt(LocalDateTime.now());

        return DailyChecklistConfigResponse.fromEntity(configRepository.save(config), user);
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
        ZoneId zone = ZoneId.of(user.getTimezone() != null ? user.getTimezone() : "UTC");
        LocalDate today = LocalDate.now(zone);
        DailyChecklistConfig config = getConfigOrDefaults(user.getUserId());
        List<GoogleCalendarService.BusyBlock> busyBlocks = loadTodayBusyBlocks(user, zone, config);
        return dailyChecklistRepository.findByUserIdAndPlanDate(user.getUserId(), today)
                .map(dc -> buildResponse(dc, user, busyBlocks))
                .orElse(null);
    }

    public com.nagai.backend.dailychecklist.DailyChecklistResponse generateDailyChecklist() {
        User user = userService.getCurrentUser();
        ZoneId zone = ZoneId.of(user.getTimezone() != null ? user.getTimezone() : "UTC");
        LocalDate today = LocalDate.now(zone);
        LocalTime nowTime = LocalTime.now(zone);
        DailyChecklist existingChecklist = dailyChecklistRepository
                .findByUserIdAndPlanDate(user.getUserId(), today)
                .orElse(null);
        boolean isRegeneration = existingChecklist != null;
        if (isRegeneration && existingChecklist.getGenerationCount() != null
                && existingChecklist.getGenerationCount() >= 2) {
            throw new DailyChecklistRegenerationLimitException();
        }

        // Load config
        DailyChecklistConfig config = getConfigOrDefaults(user.getUserId());

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

        // Fetch calendar events if connected and enabled
        List<GoogleCalendarService.BusyBlock> busyBlocks = loadTodayBusyBlocks(user, zone, config);
        List<CalendarBusyBlock> aiBusyBlocks = busyBlocks.stream()
                .map(e -> CalendarBusyBlock.newBuilder()
                        .setStartTime(e.startTime())
                        .setEndTime(e.endTime())
                        .setSummary(e.summary() != null ? e.summary() : "")
                        .build())
                .toList();

        // Call AI
        String currentTime = nowTime.format(DateTimeFormatter.ofPattern("HH:mm"));
        String dayOfWeek = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String planDate = today.toString();
        String userProfile = ProfileUtils.buildUserProfile(user);

        DailyChecklistResponse aiResponse = aiGrpcClientService.generateDailyChecklist(
                candidates, recurringItems, config.getMaxItems(),
                currentTime, userProfile, dayOfWeek, planDate, aiBusyBlocks);

        // Validate AI returned usable items
        List<DailyChecklistItemSuggestion> validSuggestions = filterValidSuggestions(
                aiResponse.getItemsList(), busyBlocks, today);
        if (validSuggestions.isEmpty()) {
            throw new DailyChecklistException(
                    "Couldn't build a valid plan for today. "
                    + "Try regenerating or adjusting your goals, recurring anchors, or calendar settings.");
        }

        DailyChecklist checklist;
        int startingSortOrder = 0;
        if (isRegeneration) {
            checklist = existingChecklist;
            List<DailyChecklistItem> currentItems = dailyItemRepository
                    .findByDailyChecklistIdOrderBySortOrder(checklist.getDailyChecklistId());
            List<DailyChecklistItem> preservedCompleted = currentItems.stream()
                    .filter(DailyChecklistItem::isCompleted)
                    .toList();
            List<DailyChecklistItem> incompleteItems = currentItems.stream()
                    .filter(item -> !item.isCompleted())
                    .toList();

            if (!incompleteItems.isEmpty()) {
                dailyItemRepository.deleteAll(incompleteItems);
            }

            int nextSortOrder = 0;
            for (DailyChecklistItem preservedItem : preservedCompleted) {
                preservedItem.setSortOrder(nextSortOrder++);
            }
            if (!preservedCompleted.isEmpty()) {
                dailyItemRepository.saveAll(preservedCompleted);
            }

            startingSortOrder = nextSortOrder;
            checklist.setGenerationCount((checklist.getGenerationCount() == null
                    ? 1 : checklist.getGenerationCount()) + 1);
            checklist = dailyChecklistRepository.save(checklist);
        } else {
            checklist = new DailyChecklist();
            checklist.setUserId(user.getUserId());
            checklist.setPlanDate(today);
            checklist.setGenerationCount(1);
            checklist = dailyChecklistRepository.save(checklist);
        }

        // Parse AI response and create items
        List<DailyChecklistItem> items = new ArrayList<>();
        int sortOrder = startingSortOrder;
        for (DailyChecklistItemSuggestion suggestion : validSuggestions) {
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

        return buildResponse(checklist, user, busyBlocks);
    }

    // ---- Toggle with write-through ----

    public DailyChecklistItemResponse toggleDailyItem(Long dailyItemId) {
        User user = userService.getCurrentUser();
        DailyChecklistItem dailyItem = getOwnedDailyItem(dailyItemId, user);

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

    public DailyChecklistItemResponse addDailyItem(DailyChecklistItemCreateRequest request) {
        User user = userService.getCurrentUser();
        DailyChecklist checklist = getTodayChecklistEntityForUser(user);
        List<DailyChecklistItem> currentItems = dailyItemRepository
                .findByDailyChecklistIdOrderBySortOrder(checklist.getDailyChecklistId());

        DailyChecklistItem item = new DailyChecklistItem();
        item.setDailyChecklistId(checklist.getDailyChecklistId());
        item.setParentChecklistId(null);
        item.setParentGoalId(null);
        item.setSortOrder(currentItems.size());
        item.setTitle(request.getTitle().trim());
        item.setNotes(normalizeNullableText(request.getNotes()));
        item.setScheduledTime(normalizeNullableText(request.getScheduledTime()));
        item.setCompleted(false);
        item.setCompletedAt(null);

        return resolveItemResponse(dailyItemRepository.save(item));
    }

    public DailyChecklistItemResponse updateDailyItem(
            Long dailyItemId,
            DailyChecklistItemUpdateRequest request) {
        User user = userService.getCurrentUser();
        DailyChecklistItem item = getOwnedDailyItem(dailyItemId, user);

        if (request.getTitle() != null) {
            String title = request.getTitle().trim();
            if (title.isEmpty()) {
                throw new DailyChecklistException("title is required");
            }
            item.setTitle(title);
        }
        if (request.getNotes() != null || request.isNotesProvided()) {
            item.setNotes(normalizeNullableText(request.getNotes()));
        }
        if (request.getScheduledTime() != null || request.isScheduledTimeProvided()) {
            item.setScheduledTime(normalizeNullableText(request.getScheduledTime()));
        }

        return resolveItemResponse(dailyItemRepository.save(item));
    }

    public com.nagai.backend.dailychecklist.DailyChecklistResponse reorderTodayItems(
            DailyChecklistReorderRequest request) {
        User user = userService.getCurrentUser();
        ZoneId zone = ZoneId.of(user.getTimezone() != null ? user.getTimezone() : "UTC");
        DailyChecklistConfig config = getConfigOrDefaults(user.getUserId());
        DailyChecklist checklist = getTodayChecklistEntityForUser(user);
        List<GoogleCalendarService.BusyBlock> busyBlocks = loadTodayBusyBlocks(user, zone, config);
        List<DailyChecklistItem> items = dailyItemRepository
                .findByDailyChecklistIdOrderBySortOrder(checklist.getDailyChecklistId());
        List<DailyChecklistItem> movableItems = items.stream()
                .filter(item -> item.getScheduledTime() == null || item.getScheduledTime().isBlank())
                .toList();
        validateReorderPayload(
                request.getOrderedItemIds(),
                movableItems.stream().map(DailyChecklistItem::getDailyItemId).toList(),
                "Only unscheduled daily items can be reordered");

        applyDailyReorder(items, request.getOrderedItemIds());
        dailyItemRepository.saveAll(items);
        return buildResponse(checklist, user, busyBlocks);
    }

    // ---- Delete ----

    public void deleteDailyItem(Long dailyItemId) {
        User user = userService.getCurrentUser();
        DailyChecklistItem dailyItem = getOwnedDailyItem(dailyItemId, user);

        dailyItemRepository.delete(dailyItem);
    }

    // ---- Helpers ----

    private com.nagai.backend.dailychecklist.DailyChecklistResponse buildResponse(
            DailyChecklist checklist, User user, List<GoogleCalendarService.BusyBlock> busyBlocks) {
        List<DailyChecklistItem> items = dailyItemRepository
                .findByDailyChecklistIdOrderBySortOrder(checklist.getDailyChecklistId());
        List<DailyChecklistItemResponse> itemResponses = items.stream()
                .map(this::resolveItemResponse)
                .toList();
        List<DailyChecklistBusyBlockResponse> busyBlockResponses = busyBlocks.stream()
                .map(DailyChecklistBusyBlockResponse::fromBusyBlock)
                .toList();
        return new com.nagai.backend.dailychecklist.DailyChecklistResponse(
                checklist.getDailyChecklistId(),
                checklist.getPlanDate().toString(),
                checklist.getGeneratedAt() != null ? checklist.getGeneratedAt().toString() : null,
                checklist.getGenerationCount(),
                itemResponses,
                busyBlockResponses);
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

    private List<GoogleCalendarService.BusyBlock> loadTodayBusyBlocks(
            User user,
            ZoneId zone,
            DailyChecklistConfig config) {
        if (!config.isCalendarEnabled() || !user.isCalendarConnected()) {
            return List.of();
        }

        try {
            List<GoogleCalendarService.BusyBlock> busyBlocks =
                    googleCalendarService.fetchTodayEvents(user, zone);
            if (!busyBlocks.isEmpty()) {
                log.info("Loaded {} calendar events for user={}", busyBlocks.size(), user.getUserId());
            }
            return busyBlocks;
        } catch (Exception e) {
            log.warn("Calendar fetch failed for user={}, continuing without it: {}",
                    user.getUserId(), e.getMessage());
            return List.of();
        }
    }

    private DailyChecklistConfig getConfigOrDefaults(Long userId) {
        return configRepository.findByUserId(userId).orElseGet(() -> {
            DailyChecklistConfig config = new DailyChecklistConfig();
            config.setUserId(userId);
            config.setMaxItems(10);
            config.setCalendarEnabled(true);
            return config;
        });
    }

    private DailyChecklist getTodayChecklistEntityForUser(User user) {
        LocalDate today = todayInUserTimezone(user);
        return dailyChecklistRepository.findByUserIdAndPlanDate(user.getUserId(), today)
                .orElseThrow(() -> new DailyChecklistException(
                        "Generate a daily plan before editing today’s items"));
    }

    private DailyChecklistItem getOwnedDailyItem(Long dailyItemId, User user) {
        DailyChecklistItem dailyItem = dailyItemRepository.findById(dailyItemId)
                .orElseThrow(DailyChecklistItemNotFoundException::new);
        DailyChecklist checklist = dailyChecklistRepository.findById(dailyItem.getDailyChecklistId())
                .orElseThrow(DailyChecklistItemNotFoundException::new);
        if (!checklist.getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("You do not have permission to modify this item");
        }
        return dailyItem;
    }

    private String normalizeNullableText(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateReorderPayload(List<Long> submittedIds, List<Long> expectedIds, String errorMessage) {
        List<Long> safeSubmitted = submittedIds == null ? List.of() : submittedIds;
        if (safeSubmitted.size() != expectedIds.size()) {
            throw new DailyChecklistException(errorMessage);
        }

        Set<Long> submittedSet = new HashSet<>(safeSubmitted);
        Set<Long> expectedSet = new HashSet<>(expectedIds);
        if (submittedSet.size() != safeSubmitted.size() || !submittedSet.equals(expectedSet)) {
            throw new DailyChecklistException(errorMessage);
        }
    }

    private void applyDailyReorder(List<DailyChecklistItem> items, List<Long> orderedItemIds) {
        List<DailyChecklistItem> movableItems = items.stream()
                .filter(item -> item.getScheduledTime() == null || item.getScheduledTime().isBlank())
                .toList();
        Map<Long, DailyChecklistItem> movableById = movableItems.stream()
                .collect(java.util.stream.Collectors.toMap(DailyChecklistItem::getDailyItemId, item -> item));

        int movableIndex = 0;
        int nextSortOrder = 0;
        for (DailyChecklistItem item : items) {
            if (item.getScheduledTime() == null || item.getScheduledTime().isBlank()) {
                DailyChecklistItem reordered = movableById.get(orderedItemIds.get(movableIndex++));
                reordered.setSortOrder(nextSortOrder++);
            } else {
                item.setSortOrder(nextSortOrder++);
            }
        }
    }

    private List<DailyChecklistItemSuggestion> filterValidSuggestions(
            List<DailyChecklistItemSuggestion> suggestions,
            List<GoogleCalendarService.BusyBlock> busyBlocks,
            LocalDate planDate) {
        if (suggestions == null || suggestions.isEmpty()) {
            return List.of();
        }

        List<DailyChecklistItemSuggestion> validSuggestions = new ArrayList<>();
        for (DailyChecklistItemSuggestion suggestion : suggestions) {
            if (isValidSuggestion(suggestion, busyBlocks, planDate)) {
                validSuggestions.add(suggestion);
            }
        }
        return validSuggestions;
    }

    private boolean isValidSuggestion(
            DailyChecklistItemSuggestion suggestion,
            List<GoogleCalendarService.BusyBlock> busyBlocks,
            LocalDate planDate) {
        String combinedText = ((suggestion.getTitle() != null ? suggestion.getTitle() : "") + " "
                + (suggestion.getNotes() != null ? suggestion.getNotes() : "")).trim();

        if (mentionsFutureDay(combinedText, planDate)) {
            log.info("Dropping daily suggestion for future-day language: title={}", suggestion.getTitle());
            return false;
        }
        if (echoesBusyBlock(combinedText, busyBlocks)) {
            log.info("Dropping daily suggestion that echoes a busy block: title={}", suggestion.getTitle());
            return false;
        }
        if (scheduledInsideBusyBlock(suggestion.getScheduledTime(), busyBlocks)) {
            log.info("Dropping daily suggestion scheduled during busy time: title={} time={}",
                    suggestion.getTitle(), suggestion.getScheduledTime());
            return false;
        }
        return true;
    }

    private boolean mentionsFutureDay(String text, LocalDate planDate) {
        if (text == null || text.isBlank()) {
            return false;
        }

        if (NEXT_DAY_PATTERN.matcher(text).find()) {
            return true;
        }

        Matcher matcher = ISO_DATE_PATTERN.matcher(text);
        while (matcher.find()) {
            LocalDate mentionedDate;
            try {
                mentionedDate = LocalDate.parse(matcher.group());
            } catch (Exception e) {
                continue;
            }
            if (!mentionedDate.equals(planDate)) {
                return true;
            }
        }
        return false;
    }

    private boolean echoesBusyBlock(String text, List<GoogleCalendarService.BusyBlock> busyBlocks) {
        if (text == null || text.isBlank() || busyBlocks.isEmpty()) {
            return false;
        }

        String normalizedText = normalizeText(text);
        String lowerText = text.toLowerCase(Locale.ENGLISH);
        for (GoogleCalendarService.BusyBlock busyBlock : busyBlocks) {
            String normalizedSummary = normalizeText(busyBlock.summary());
            if (normalizedSummary.length() >= 4 && normalizedText.contains(normalizedSummary)) {
                return true;
            }

            String start = busyBlock.startTime();
            String end = busyBlock.endTime();
            if (lowerText.contains(start.toLowerCase(Locale.ENGLISH) + "-" + end.toLowerCase(Locale.ENGLISH))
                    || lowerText.contains(start.toLowerCase(Locale.ENGLISH) + "–" + end.toLowerCase(Locale.ENGLISH))
                    || lowerText.contains(start.toLowerCase(Locale.ENGLISH) + " to " + end.toLowerCase(Locale.ENGLISH))
                    || (lowerText.contains(start.toLowerCase(Locale.ENGLISH))
                    && lowerText.contains(end.toLowerCase(Locale.ENGLISH)))) {
                return true;
            }
        }
        return false;
    }

    private boolean scheduledInsideBusyBlock(
            String scheduledTime,
            List<GoogleCalendarService.BusyBlock> busyBlocks) {
        if (scheduledTime == null || scheduledTime.isBlank() || busyBlocks.isEmpty()) {
            return false;
        }

        LocalTime scheduled;
        try {
            scheduled = LocalTime.parse(scheduledTime, TIME_FORMATTER);
        } catch (Exception e) {
            return false;
        }

        for (GoogleCalendarService.BusyBlock busyBlock : busyBlocks) {
            try {
                LocalTime start = LocalTime.parse(busyBlock.startTime(), TIME_FORMATTER);
                LocalTime end = LocalTime.parse(busyBlock.endTime(), TIME_FORMATTER);
                boolean isAllDay = "00:00".equals(busyBlock.startTime()) && "23:59".equals(busyBlock.endTime());
                boolean overlaps = isAllDay
                        ? !scheduled.isBefore(start) && !scheduled.isAfter(end)
                        : !scheduled.isBefore(start) && scheduled.isBefore(end);
                if (overlaps) {
                    return true;
                }
            } catch (Exception e) {
                log.debug("Skipping busy block time comparison for malformed block {}-{}",
                        busyBlock.startTime(), busyBlock.endTime());
            }
        }
        return false;
    }

    private String normalizeText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        return text.toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
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
