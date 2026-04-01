package com.nagai.backend.dailychecklist;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.nagai.ai.DailyChecklistItemSuggestion;
import com.nagai.backend.ai.AiGrpcClientService;
import com.nagai.backend.calendar.GoogleCalendarService;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.exceptions.DailyChecklistException;
import com.nagai.backend.exceptions.DailyChecklistRegenerationLimitException;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.goals.GoalService;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DailyChecklistServiceTest {

    @Mock private DailyChecklistConfigRepository configRepository;
    @Mock private DailyChecklistRepository dailyChecklistRepository;
    @Mock private DailyChecklistItemRepository dailyItemRepository;
    @Mock private ChecklistRepository checklistRepository;
    @Mock private GoalRepository goalRepository;
    @Mock private GoalService goalService;
    @Mock private UserService userService;
    @Mock private AiGrpcClientService aiGrpcClientService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private GoogleCalendarService googleCalendarService;

    @InjectMocks
    private DailyChecklistService dailyChecklistService;

    private User user;
    private DailyChecklistConfig config;
    private Goal goal;
    private ChecklistItem checklistItem;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");
        user.setTimezone("America/New_York");

        config = new DailyChecklistConfig();
        config.setConfigId(10L);
        config.setUserId(1L);
        config.setMaxItems(5);
        config.setCalendarEnabled(false);

        goal = new Goal();
        goal.setGoalId(5L);
        goal.setUserId(1L);
        goal.setTitle("Launch beta");

        checklistItem = new ChecklistItem();
        checklistItem.setChecklistId(100L);
        checklistItem.setGoalId(5L);
        checklistItem.setTitle("Draft onboarding email");
        checklistItem.setCompleted(false);

        today = LocalDate.now(java.time.ZoneId.of("America/New_York"));

        when(userService.getCurrentUser()).thenReturn(user);
        when(configRepository.findByUserId(1L)).thenReturn(Optional.of(config));
        when(goalService.getAllGoals()).thenReturn(List.of(goal));
        when(checklistRepository.findChecklistItemByGoalId(5L)).thenReturn(List.of(checklistItem));
        when(goalRepository.existsById(anyLong())).thenReturn(true);
        when(checklistRepository.existsById(anyLong())).thenReturn(true);
    }

    @Test
    void generateDailyChecklist_createsFirstPlanWithGenerationCountOne() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem savedItem = new DailyChecklistItem();
        savedItem.setDailyItemId(200L);
        savedItem.setDailyChecklistId(50L);
        savedItem.setSortOrder(0);
        savedItem.setTitle("Draft onboarding email");

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.empty());
        when(aiGrpcClientService.generateDailyChecklist(anyList(), anyList(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .thenReturn(com.nagai.ai.DailyChecklistResponse.newBuilder()
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[G5-100]")
                                .setTitle("Draft onboarding email")
                                .build())
                        .build());
        when(dailyChecklistRepository.save(any(DailyChecklist.class))).thenReturn(checklist);
        when(dailyItemRepository.save(any(DailyChecklistItem.class))).thenReturn(savedItem);
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L)).thenReturn(List.of(savedItem));
        when(goalService.getGoal(5L)).thenReturn(goal);

        DailyChecklistResponse result = dailyChecklistService.generateDailyChecklist();

        assertThat(result.generationCount()).isEqualTo(1);
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).title()).isEqualTo("Draft onboarding email");
    }

    @Test
    void generateDailyChecklist_returnsBusyBlocksSeparatelyFromItems() {
        config.setCalendarEnabled(true);
        user.setGoogleCalendarRefreshToken("refresh-token");

        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem savedItem = new DailyChecklistItem();
        savedItem.setDailyItemId(200L);
        savedItem.setDailyChecklistId(50L);
        savedItem.setSortOrder(0);
        savedItem.setTitle("Draft onboarding email");
        savedItem.setScheduledTime("11:30");

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.empty());
        when(googleCalendarService.fetchTodayEvents(any(User.class), any(java.time.ZoneId.class)))
                .thenReturn(List.of(new GoogleCalendarService.BusyBlock("10:00", "11:00", "Team sync")));
        when(aiGrpcClientService.generateDailyChecklist(anyList(), anyList(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .thenReturn(com.nagai.ai.DailyChecklistResponse.newBuilder()
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[G5-100]")
                                .setTitle("Draft onboarding email")
                                .setScheduledTime("11:30")
                                .build())
                        .build());
        when(dailyChecklistRepository.save(any(DailyChecklist.class))).thenReturn(checklist);
        when(dailyItemRepository.save(any(DailyChecklistItem.class))).thenReturn(savedItem);
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L)).thenReturn(List.of(savedItem));
        when(goalService.getGoal(5L)).thenReturn(goal);

        DailyChecklistResponse result = dailyChecklistService.generateDailyChecklist();

        assertThat(result.items()).extracting(DailyChecklistItemResponse::title)
                .containsExactly("Draft onboarding email");
        assertThat(result.busyBlocks()).hasSize(1);
        assertThat(result.busyBlocks().get(0).summary()).isEqualTo("Team sync");
    }

    @Test
    void generateDailyChecklist_regeneratesOnceAndPreservesCompletedItems() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem completedItem = new DailyChecklistItem();
        completedItem.setDailyItemId(201L);
        completedItem.setDailyChecklistId(50L);
        completedItem.setTitle("Already done");
        completedItem.setCompleted(true);
        completedItem.setSortOrder(0);

        DailyChecklistItem incompleteItem = new DailyChecklistItem();
        incompleteItem.setDailyItemId(202L);
        incompleteItem.setDailyChecklistId(50L);
        incompleteItem.setTitle("Replace me");
        incompleteItem.setCompleted(false);
        incompleteItem.setSortOrder(1);

        DailyChecklistItem regeneratedItem = new DailyChecklistItem();
        regeneratedItem.setDailyItemId(203L);
        regeneratedItem.setDailyChecklistId(50L);
        regeneratedItem.setTitle("New suggestion");
        regeneratedItem.setCompleted(false);
        regeneratedItem.setSortOrder(1);

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.of(checklist));
        when(aiGrpcClientService.generateDailyChecklist(anyList(), anyList(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .thenReturn(com.nagai.ai.DailyChecklistResponse.newBuilder()
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[G5-100]")
                                .setTitle("New suggestion")
                                .build())
                        .build());
        when(dailyChecklistRepository.save(any(DailyChecklist.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L))
                .thenReturn(List.of(completedItem, incompleteItem))
                .thenReturn(List.of(completedItem, regeneratedItem));
        when(dailyItemRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(dailyItemRepository.save(any(DailyChecklistItem.class))).thenReturn(regeneratedItem);
        when(goalService.getGoal(5L)).thenReturn(goal);

        DailyChecklistResponse result = dailyChecklistService.generateDailyChecklist();

        assertThat(result.generationCount()).isEqualTo(2);
        assertThat(result.items()).extracting(DailyChecklistItemResponse::title)
                .containsExactly("Already done", "New suggestion");
        verify(dailyItemRepository).deleteAll(List.of(incompleteItem));
    }

    @Test
    void generateDailyChecklist_rejectsSecondRegeneration() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(2);

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.of(checklist));

        assertThatThrownBy(() -> dailyChecklistService.generateDailyChecklist())
                .isInstanceOf(DailyChecklistRegenerationLimitException.class)
                .hasMessage("Today's daily plan has already been regenerated once");

        verify(aiGrpcClientService, never()).generateDailyChecklist(anyList(), anyList(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyList());
    }

    @Test
    void generateDailyChecklist_filtersSuggestionsScheduledDuringBusyBlocks() {
        config.setCalendarEnabled(true);
        user.setGoogleCalendarRefreshToken("refresh-token");

        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem savedItem = new DailyChecklistItem();
        savedItem.setDailyItemId(203L);
        savedItem.setDailyChecklistId(50L);
        savedItem.setTitle("Inbox cleanup");
        savedItem.setScheduledTime("11:30");
        savedItem.setSortOrder(0);

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.empty());
        when(googleCalendarService.fetchTodayEvents(any(User.class), any(java.time.ZoneId.class)))
                .thenReturn(List.of(new GoogleCalendarService.BusyBlock("10:00", "11:00", "Team sync")));
        when(aiGrpcClientService.generateDailyChecklist(anyList(), anyList(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .thenReturn(com.nagai.ai.DailyChecklistResponse.newBuilder()
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[NEW]")
                                .setTitle("Team sync")
                                .setScheduledTime("10:30")
                                .build())
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[NEW]")
                                .setTitle("Inbox cleanup")
                                .setScheduledTime("11:30")
                                .build())
                        .build());
        when(dailyChecklistRepository.save(any(DailyChecklist.class))).thenReturn(checklist);
        when(dailyItemRepository.save(any(DailyChecklistItem.class))).thenReturn(savedItem);
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L)).thenReturn(List.of(savedItem));

        DailyChecklistResponse result = dailyChecklistService.generateDailyChecklist();

        assertThat(result.items()).extracting(DailyChecklistItemResponse::title)
                .containsExactly("Inbox cleanup");
    }

    @Test
    void generateDailyChecklist_filtersSuggestionsThatEchoBusyBlocks() {
        config.setCalendarEnabled(true);
        user.setGoogleCalendarRefreshToken("refresh-token");

        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem savedItem = new DailyChecklistItem();
        savedItem.setDailyItemId(204L);
        savedItem.setDailyChecklistId(50L);
        savedItem.setTitle("Work block");
        savedItem.setScheduledTime("11:15");
        savedItem.setSortOrder(0);

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.empty());
        when(googleCalendarService.fetchTodayEvents(any(User.class), any(java.time.ZoneId.class)))
                .thenReturn(List.of(new GoogleCalendarService.BusyBlock("10:00", "11:00", "Weekly planning")));
        when(aiGrpcClientService.generateDailyChecklist(anyList(), anyList(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .thenReturn(com.nagai.ai.DailyChecklistResponse.newBuilder()
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[NEW]")
                                .setTitle("Weekly planning")
                                .setNotes("10:00-11:00")
                                .build())
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[NEW]")
                                .setTitle("Work block")
                                .setScheduledTime("11:15")
                                .build())
                        .build());
        when(dailyChecklistRepository.save(any(DailyChecklist.class))).thenReturn(checklist);
        when(dailyItemRepository.save(any(DailyChecklistItem.class))).thenReturn(savedItem);
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L)).thenReturn(List.of(savedItem));

        DailyChecklistResponse result = dailyChecklistService.generateDailyChecklist();

        assertThat(result.items()).extracting(DailyChecklistItemResponse::title)
                .containsExactly("Work block");
    }

    @Test
    void generateDailyChecklist_filtersFutureDaySuggestionsAndFailsWhenNoneRemain() {
        config.setCalendarEnabled(false);

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.empty());
        when(aiGrpcClientService.generateDailyChecklist(anyList(), anyList(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .thenReturn(com.nagai.ai.DailyChecklistResponse.newBuilder()
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[NEW]")
                                .setTitle("Tomorrow planning session")
                                .build())
                        .addItems(DailyChecklistItemSuggestion.newBuilder()
                                .setLabel("[NEW]")
                                .setTitle("Follow up")
                                .setNotes("Do this on 2099-01-01")
                                .build())
                        .build());

        assertThatThrownBy(() -> dailyChecklistService.generateDailyChecklist())
                .isInstanceOf(DailyChecklistException.class)
                .hasMessageContaining("Couldn't build a valid plan for today");
    }

    @Test
    void reorderTodayItems_allowsUnscheduledItemsBetweenScheduledAnchors() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem unscheduledFirst = new DailyChecklistItem();
        unscheduledFirst.setDailyItemId(201L);
        unscheduledFirst.setDailyChecklistId(50L);
        unscheduledFirst.setTitle("First");
        unscheduledFirst.setSortOrder(0);

        DailyChecklistItem scheduled = new DailyChecklistItem();
        scheduled.setDailyItemId(202L);
        scheduled.setDailyChecklistId(50L);
        scheduled.setTitle("Fixed");
        scheduled.setScheduledTime("09:00");
        scheduled.setSortOrder(1);

        DailyChecklistItem unscheduledLast = new DailyChecklistItem();
        unscheduledLast.setDailyItemId(203L);
        unscheduledLast.setDailyChecklistId(50L);
        unscheduledLast.setTitle("Last");
        unscheduledLast.setSortOrder(2);

        DailyChecklistItem scheduledLater = new DailyChecklistItem();
        scheduledLater.setDailyItemId(204L);
        scheduledLater.setDailyChecklistId(50L);
        scheduledLater.setTitle("Later fixed");
        scheduledLater.setScheduledTime("13:00");
        scheduledLater.setSortOrder(3);

        DailyChecklistReorderRequest request = new DailyChecklistReorderRequest();
        request.setOrderedItemIds(List.of(202L, 203L, 204L, 201L));

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.of(checklist));
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L))
                .thenReturn(List.of(unscheduledFirst, scheduled, unscheduledLast, scheduledLater))
                .thenReturn(List.of(scheduled, unscheduledLast, scheduledLater, unscheduledFirst));
        when(dailyItemRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        DailyChecklistResponse result = dailyChecklistService.reorderTodayItems(request);

        assertThat(result.items()).extracting(DailyChecklistItemResponse::title)
                .containsExactly("Fixed", "Last", "Later fixed", "First");
        assertThat(scheduled.getSortOrder()).isEqualTo(0);
        assertThat(unscheduledLast.getSortOrder()).isEqualTo(1);
        assertThat(scheduledLater.getSortOrder()).isEqualTo(2);
        assertThat(unscheduledFirst.getSortOrder()).isEqualTo(3);
    }

    @Test
    void reorderTodayItems_rejectsChangingScheduledAnchorOrder() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem unscheduled = new DailyChecklistItem();
        unscheduled.setDailyItemId(201L);
        unscheduled.setDailyChecklistId(50L);
        unscheduled.setTitle("Flexible");

        DailyChecklistItem scheduledMorning = new DailyChecklistItem();
        scheduledMorning.setDailyItemId(202L);
        scheduledMorning.setDailyChecklistId(50L);
        scheduledMorning.setTitle("Morning");
        scheduledMorning.setScheduledTime("09:00");

        DailyChecklistItem scheduledEvening = new DailyChecklistItem();
        scheduledEvening.setDailyItemId(203L);
        scheduledEvening.setDailyChecklistId(50L);
        scheduledEvening.setTitle("Evening");
        scheduledEvening.setScheduledTime("13:00");

        DailyChecklistReorderRequest request = new DailyChecklistReorderRequest();
        request.setOrderedItemIds(List.of(203L, 201L, 202L));

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.of(checklist));
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L))
                .thenReturn(List.of(unscheduled, scheduledMorning, scheduledEvening));

        assertThatThrownBy(() -> dailyChecklistService.reorderTodayItems(request))
                .isInstanceOf(DailyChecklistException.class)
                .hasMessage("Scheduled daily items must keep their relative order");

        verify(dailyItemRepository, never()).saveAll(anyList());
    }

    @Test
    void reorderTodayItems_rejectsInvalidPayload() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem unscheduled = new DailyChecklistItem();
        unscheduled.setDailyItemId(201L);
        unscheduled.setDailyChecklistId(50L);
        unscheduled.setTitle("Flexible");

        DailyChecklistItem scheduled = new DailyChecklistItem();
        scheduled.setDailyItemId(202L);
        scheduled.setDailyChecklistId(50L);
        scheduled.setTitle("Fixed");
        scheduled.setScheduledTime("09:00");

        DailyChecklistReorderRequest request = new DailyChecklistReorderRequest();
        request.setOrderedItemIds(List.of(201L, 202L, 202L));

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.of(checklist));
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L))
                .thenReturn(List.of(unscheduled, scheduled));

        assertThatThrownBy(() -> dailyChecklistService.reorderTodayItems(request))
                .isInstanceOf(DailyChecklistException.class)
                .hasMessage("Daily checklist reorder payload is invalid");

        verify(dailyItemRepository, never()).saveAll(anyList());
    }

    @Test
    void updateDailyItem_allowsClearingScheduledTime() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem item = new DailyChecklistItem();
        item.setDailyItemId(201L);
        item.setDailyChecklistId(50L);
        item.setTitle("Morning task");
        item.setScheduledTime("08:30");

        DailyChecklistItemUpdateRequest request = new DailyChecklistItemUpdateRequest();
        request.setScheduledTime(null);

        when(dailyItemRepository.findById(201L)).thenReturn(Optional.of(item));
        when(dailyChecklistRepository.findById(50L)).thenReturn(Optional.of(checklist));
        when(dailyItemRepository.save(any(DailyChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

        DailyChecklistItemResponse result = dailyChecklistService.updateDailyItem(201L, request);

        assertThat(result.scheduledTime()).isNull();
    }

    @Test
    void addDailyItem_allowsMissingScheduledTime() {
        DailyChecklist checklist = new DailyChecklist();
        checklist.setDailyChecklistId(50L);
        checklist.setUserId(1L);
        checklist.setPlanDate(today);
        checklist.setGenerationCount(1);

        DailyChecklistItem savedItem = new DailyChecklistItem();
        savedItem.setDailyItemId(205L);
        savedItem.setDailyChecklistId(50L);
        savedItem.setTitle("Inbox zero");
        savedItem.setSortOrder(0);

        DailyChecklistItemCreateRequest request = new DailyChecklistItemCreateRequest();
        request.setTitle("Inbox zero");

        when(dailyChecklistRepository.findByUserIdAndPlanDate(1L, today)).thenReturn(Optional.of(checklist));
        when(dailyItemRepository.findByDailyChecklistIdOrderBySortOrder(50L)).thenReturn(List.of());
        when(dailyItemRepository.save(any(DailyChecklistItem.class))).thenReturn(savedItem);

        DailyChecklistItemResponse result = dailyChecklistService.addDailyItem(request);

        assertThat(result.title()).isEqualTo("Inbox zero");
        assertThat(result.scheduledTime()).isNull();
    }
}
