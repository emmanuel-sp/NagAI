package com.nagai.backend.ai;

import com.nagai.ai.ChecklistItem;
import com.nagai.ai.ChecklistItemResponse;
import com.nagai.ai.FullChecklistResponse;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.exceptions.AiServiceException;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalService;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiControllerTest {

    @Mock
    private AiGrpcClientService aiGrpcClientService;

    @Mock
    private GoalService goalService;

    @Mock
    private UserService userService;

    @Mock
    private ChecklistRepository checklistRepository;

    private AiController controller;
    private User user;
    private Goal goal;

    @BeforeEach
    void setUp() {
        controller = new AiController(aiGrpcClientService, goalService, userService, checklistRepository);

        user = new User();
        user.setUserId(1L);

        goal = new Goal();
        goal.setGoalId(10L);
        goal.setUserId(1L);
        goal.setTitle("Run a marathon");
        goal.setDescription("Complete 26.2 miles");
    }

    @Test
    void suggestSmartField_returnsOkWithSuggestion() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(aiGrpcClientService.suggestSmartField("measurable", "Run a marathon", "Complete 26.2 miles",
                Map.of("specific", "Complete the NYC Marathon 2026"), "", null, null))
                .thenReturn("Log weekly mileage and finish a sub-4-hour marathon by December");

        ResponseEntity<SmartGoalSuggestionResponse> response = controller.suggestSmartField(
                new SmartGoalSuggestionRequest("measurable", "Run a marathon", "Complete 26.2 miles",
                        Map.of("specific", "Complete the NYC Marathon 2026"), null, null));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().suggestion())
                .isEqualTo("Log weekly mileage and finish a sub-4-hour marathon by December");
    }

    @Test
    void suggestSmartField_propagatesAiServiceException() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(aiGrpcClientService.suggestSmartField(any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new AiServiceException("AI service unavailable: Connection refused"));

        assertThatThrownBy(() -> controller.suggestSmartField(
                new SmartGoalSuggestionRequest("specific", "Get fit", "Exercise regularly", null, null, null)))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("Connection refused");
    }

    @Test
    void generateChecklistItem_returnsOkWithItem() {
        when(goalService.getGoal(10L)).thenReturn(goal);
        when(userService.getCurrentUser()).thenReturn(user);
        when(checklistRepository.findChecklistItemByGoalId(10L)).thenReturn(List.of());
        when(aiGrpcClientService.generateChecklistItem(
                "Run a marathon", "Complete 26.2 miles",
                List.of(), List.of(), "", ""))
                .thenReturn(ChecklistItemResponse.newBuilder()
                        .setTitle("Sign up for a race")
                        .setNotes("Find a local 5K first")
                        .setDeadline("2026-04-01")
                        .build());

        ResponseEntity<AiChecklistItemResponse> response = controller.generateChecklistItem(
                new ChecklistItemSuggestionRequest(10L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().title()).isEqualTo("Sign up for a race");
        assertThat(response.getBody().deadline()).isEqualTo("2026-04-01");
    }

    @Test
    void generateChecklistItem_whenGoalNotOwned_throwsAccessDeniedException() {
        goal.setUserId(99L);
        when(goalService.getGoal(10L)).thenReturn(goal);
        when(userService.getCurrentUser()).thenReturn(user);

        assertThatThrownBy(() -> controller.generateChecklistItem(
                new ChecklistItemSuggestionRequest(10L)))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void generateFullChecklist_returnsOkWithItems() {
        when(goalService.getGoal(10L)).thenReturn(goal);
        when(userService.getCurrentUser()).thenReturn(user);
        when(checklistRepository.findChecklistItemByGoalId(10L)).thenReturn(List.of());
        when(aiGrpcClientService.generateFullChecklist(
                "Run a marathon", "Complete 26.2 miles", List.of(), "", ""))
                .thenReturn(FullChecklistResponse.newBuilder()
                        .addItems(ChecklistItem.newBuilder().setTitle("Research training plans").setNotes("16-week plan").setDeadline("2026-03-15").build())
                        .addItems(ChecklistItem.newBuilder().setTitle("Buy running shoes").build())
                        .build());

        ResponseEntity<List<AiChecklistItemResponse>> response = controller.generateFullChecklist(
                new FullChecklistSuggestionRequest(10L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).title()).isEqualTo("Research training plans");
        assertThat(response.getBody().get(0).notes()).isEqualTo("16-week plan");
        assertThat(response.getBody().get(1).title()).isEqualTo("Buy running shoes");
    }

    @Test
    void generateChecklistItem_propagatesAiServiceException() {
        when(goalService.getGoal(10L)).thenReturn(goal);
        when(userService.getCurrentUser()).thenReturn(user);
        when(checklistRepository.findChecklistItemByGoalId(10L)).thenReturn(List.of());
        when(aiGrpcClientService.generateChecklistItem(any(), any(), any(), any(), any(), any()))
                .thenThrow(new AiServiceException("AI service unavailable: Connection refused"));

        assertThatThrownBy(() -> controller.generateChecklistItem(
                new ChecklistItemSuggestionRequest(10L)))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("Connection refused");
    }
}
