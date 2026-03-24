package com.nagai.backend.checklists;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.nagai.backend.dailychecklist.DailyChecklistItem;
import com.nagai.backend.dailychecklist.DailyChecklistItemRepository;
import com.nagai.backend.exceptions.ChecklistNotFoundException;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalService;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
class ChecklistServiceTest {

    @Mock
    private ChecklistRepository checklistRepository;

    @Mock
    private GoalService goalService;

    @Mock
    private UserService userService;

    @Mock
    private DailyChecklistItemRepository dailyItemRepository;

    @InjectMocks
    private ChecklistService checklistService;

    private User user;
    private Goal goal;
    private ChecklistItem item;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);

        goal = new Goal();
        goal.setGoalId(5L);
        goal.setUserId(1L);

        item = new ChecklistItem();
        item.setChecklistId(20L);
        item.setGoalId(5L);
        item.setTitle("Read chapter 1");
        item.setCompleted(false);
    }

    @Test
    void fetchGoalChecklist_returnsMappedResponses() {
        when(goalService.getGoal(5L)).thenReturn(goal);
        when(userService.getCurrentUser()).thenReturn(user);
        when(checklistRepository.findChecklistItemByGoalId(5L)).thenReturn(List.of(item));

        List<ChecklistResponse> results = checklistService.fetchGoalChecklist(5L);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Read chapter 1");
    }

    @Test
    void addChecklistItem_savesAndReturnsItem() {
        ChecklistAddRequest request = new ChecklistAddRequest();
        request.setGoalId(5L);
        request.setTitle("Read chapter 1");

        when(goalService.getGoal(5L)).thenReturn(goal);
        when(userService.getCurrentUser()).thenReturn(user);
        when(checklistRepository.save(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ChecklistResponse result = checklistService.addChecklistItem(request);

        assertThat(result.getTitle()).isEqualTo("Read chapter 1");
        assertThat(result.isCompleted()).isFalse();
        verify(checklistRepository).save(any(ChecklistItem.class));
    }

    @Test
    void addChecklistItem_throwsAccessDeniedForOtherUsersGoal() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        ChecklistAddRequest request = new ChecklistAddRequest();
        request.setGoalId(5L);
        request.setTitle("Hacked item");

        when(goalService.getGoal(5L)).thenReturn(goal);
        when(userService.getCurrentUser()).thenReturn(otherUser);

        assertThatThrownBy(() -> checklistService.addChecklistItem(request))
                .isInstanceOf(AccessDeniedException.class);

        verify(checklistRepository, never()).save(any());
    }

    @Test
    void updateChecklistItem_updatesFields() {
        ChecklistUpdateRequest request = new ChecklistUpdateRequest();
        request.setChecklistId(20L);
        request.setTitle("Read chapter 2");
        request.setCompleted(true);

        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalService.getGoal(5L)).thenReturn(goal);
        when(checklistRepository.save(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ChecklistResponse result = checklistService.updateChecklistItem(request);

        assertThat(result.getTitle()).isEqualTo("Read chapter 2");
        assertThat(result.isCompleted()).isTrue();
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    void updateChecklistItem_throwsNotFoundWhenMissing() {
        ChecklistUpdateRequest request = new ChecklistUpdateRequest();
        request.setChecklistId(999L);
        request.setTitle("Ghost item");

        when(checklistRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> checklistService.updateChecklistItem(request))
                .isInstanceOf(ChecklistNotFoundException.class);
    }

    @Test
    void updateChecklistItem_throwsAccessDeniedForOtherUsersItem() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        ChecklistUpdateRequest request = new ChecklistUpdateRequest();
        request.setChecklistId(20L);
        request.setTitle("Hacked");

        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(otherUser);
        when(goalService.getGoal(5L)).thenReturn(goal);

        assertThatThrownBy(() -> checklistService.updateChecklistItem(request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void toggleComplete_flipsCompletionState() {
        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalService.getGoal(5L)).thenReturn(goal);
        when(checklistRepository.save(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ChecklistResponse result = checklistService.toggleComplete(20L);

        assertThat(result.isCompleted()).isTrue();
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    void toggleComplete_unsetsCompletedAtWhenUnchecking() {
        item.setCompleted(true);
        item.setCompletedAt("2025-01-01T00:00:00");

        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalService.getGoal(5L)).thenReturn(goal);
        when(checklistRepository.save(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ChecklistResponse result = checklistService.toggleComplete(20L);

        assertThat(result.isCompleted()).isFalse();
        assertThat(result.getCompletedAt()).isNull();
    }

    @Test
    void deleteChecklistItem_deletesForOwner() {
        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalService.getGoal(5L)).thenReturn(goal);

        checklistService.deleteChecklistItem(20L);

        verify(checklistRepository).delete(item);
    }

    @Test
    void deleteChecklistItem_throwsNotFoundWhenMissing() {
        when(checklistRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> checklistService.deleteChecklistItem(999L))
                .isInstanceOf(ChecklistNotFoundException.class);
    }

    @Test
    void deleteChecklistItem_throwsAccessDeniedForNonOwner() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(otherUser);
        when(goalService.getGoal(5L)).thenReturn(goal);

        assertThatThrownBy(() -> checklistService.deleteChecklistItem(20L))
                .isInstanceOf(AccessDeniedException.class);

        verify(checklistRepository, never()).delete(any());
    }

    @Test
    void toggleComplete_syncsLinkedDailyItems() {
        DailyChecklistItem dailyItem = new DailyChecklistItem();
        dailyItem.setDailyItemId(100L);
        dailyItem.setParentChecklistId(20L);
        dailyItem.setCompleted(false);

        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalService.getGoal(5L)).thenReturn(goal);
        when(checklistRepository.save(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dailyItemRepository.findByParentChecklistId(20L)).thenReturn(List.of(dailyItem));

        ChecklistResponse result = checklistService.toggleComplete(20L);

        assertThat(result.isCompleted()).isTrue();
        assertThat(dailyItem.isCompleted()).isTrue();
        assertThat(dailyItem.getCompletedAt()).isNotNull();
        verify(dailyItemRepository).saveAll(List.of(dailyItem));
    }

    @Test
    void toggleComplete_unsyncsLinkedDailyItems() {
        item.setCompleted(true);
        item.setCompletedAt("2025-01-01T00:00:00");

        DailyChecklistItem dailyItem = new DailyChecklistItem();
        dailyItem.setDailyItemId(100L);
        dailyItem.setParentChecklistId(20L);
        dailyItem.setCompleted(true);
        dailyItem.setCompletedAt("2025-01-01T00:00:00");

        when(checklistRepository.findById(20L)).thenReturn(Optional.of(item));
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalService.getGoal(5L)).thenReturn(goal);
        when(checklistRepository.save(any(ChecklistItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dailyItemRepository.findByParentChecklistId(20L)).thenReturn(List.of(dailyItem));

        ChecklistResponse result = checklistService.toggleComplete(20L);

        assertThat(result.isCompleted()).isFalse();
        assertThat(dailyItem.isCompleted()).isFalse();
        assertThat(dailyItem.getCompletedAt()).isNull();
        verify(dailyItemRepository).saveAll(List.of(dailyItem));
    }
}
