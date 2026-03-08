package com.nagai.backend.goals;

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

import com.nagai.backend.exceptions.GoalNotFoundException;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
class GoalServiceTest {

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private GoalService goalService;

    private User user;
    private Goal goal;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");

        goal = new Goal();
        goal.setGoalId(10L);
        goal.setUserId(1L);
        goal.setTitle("Learn Java");
    }

    @Test
    void addGoal_savesAndReturnsGoal() {
        GoalAddRequest request = new GoalAddRequest();
        request.setTitle("Learn Java");
        request.setDescription("Master Spring Boot");

        when(userService.getCurrentUser()).thenReturn(user);
        when(goalRepository.save(any(Goal.class))).thenAnswer(inv -> inv.getArgument(0));

        Goal result = goalService.addGoal(request);

        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Learn Java");
        verify(goalRepository).save(any(Goal.class));
    }

    @Test
    void getGoal_returnsGoalWhenFound() {
        when(goalRepository.findById(10L)).thenReturn(Optional.of(goal));

        Goal result = goalService.getGoal(10L);

        assertThat(result.getGoalId()).isEqualTo(10L);
    }

    @Test
    void getGoal_throwsGoalNotFoundWhenMissing() {
        when(goalRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> goalService.getGoal(99L))
                .isInstanceOf(GoalNotFoundException.class);
    }

    @Test
    void getAllGoals_returnsOnlyCurrentUserGoals() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalRepository.findAllByUserId(1L)).thenReturn(List.of(goal));

        List<Goal> results = goalService.getAllGoals();

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getUserId()).isEqualTo(1L);
    }

    @Test
    void updateGoal_updatesGoalFields() {
        GoalUpdateRequest request = new GoalUpdateRequest();
        request.setGoalId(10L);
        request.setTitle("Learn Kotlin");
        request.setDescription("Updated description");

        when(userService.getCurrentUser()).thenReturn(user);
        when(goalRepository.findById(10L)).thenReturn(Optional.of(goal));
        when(goalRepository.save(any(Goal.class))).thenAnswer(inv -> inv.getArgument(0));

        Goal result = goalService.updateGoal(request);

        assertThat(result.getTitle()).isEqualTo("Learn Kotlin");
        assertThat(result.getDescription()).isEqualTo("Updated description");
    }

    @Test
    void updateGoal_throwsAccessDeniedForOtherUsersGoal() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        when(userService.getCurrentUser()).thenReturn(otherUser);
        when(goalRepository.findById(10L)).thenReturn(Optional.of(goal));

        GoalUpdateRequest request = new GoalUpdateRequest();
        request.setGoalId(10L);
        request.setTitle("Hacked");

        assertThatThrownBy(() -> goalService.updateGoal(request))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deleteGoal_deletesGoalForOwner() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalRepository.findById(10L)).thenReturn(Optional.of(goal));

        goalService.deleteGoal(10L);

        verify(goalRepository).delete(goal);
    }

    @Test
    void deleteGoal_throwsAccessDeniedForNonOwner() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        when(userService.getCurrentUser()).thenReturn(otherUser);
        when(goalRepository.findById(10L)).thenReturn(Optional.of(goal));

        assertThatThrownBy(() -> goalService.deleteGoal(10L))
                .isInstanceOf(AccessDeniedException.class);

        verify(goalRepository, never()).delete(any());
    }

    @Test
    void deleteGoal_throwsGoalNotFoundWhenMissing() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(goalRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> goalService.deleteGoal(99L))
                .isInstanceOf(GoalNotFoundException.class);
    }

    @Test
    void addGoal_withAllSmartFields_savesAllFields() {
        GoalAddRequest request = new GoalAddRequest();
        request.setTitle("Run a marathon");
        request.setDescription("Complete a full 26.2-mile marathon within the year");
        request.setSpecific("Register for and complete the NYC Marathon 2026");
        request.setMeasurable("Track weekly mileage using a running app; target 26.2 miles on race day");
        request.setAttainable("Follow a 16-week training plan, running 4 days per week with incremental mileage increases");
        request.setRelevant("Supports long-term fitness and mental health goals; builds discipline and confidence");
        request.setTimely("Race day is November 1, 2026; begin 16-week training plan by July 6");

        when(userService.getCurrentUser()).thenReturn(user);
        when(goalRepository.save(any(Goal.class))).thenAnswer(inv -> inv.getArgument(0));

        Goal result = goalService.addGoal(request);

        assertThat(result.getTitle()).isEqualTo("Run a marathon");
        assertThat(result.getSpecific()).isEqualTo("Register for and complete the NYC Marathon 2026");
        assertThat(result.getMeasurable()).contains("26.2 miles");
        assertThat(result.getAttainable()).contains("16-week training plan");
        assertThat(result.getRelevant()).contains("mental health");
        assertThat(result.getTimely()).contains("November 1, 2026");
    }
}
