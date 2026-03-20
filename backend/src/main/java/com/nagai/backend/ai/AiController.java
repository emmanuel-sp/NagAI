package com.nagai.backend.ai;

import com.nagai.ai.ChecklistItemResponse;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.common.ProfileUtils;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalService;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiGrpcClientService aiGrpcClientService;
    private final GoalService goalService;
    private final UserService userService;
    private final ChecklistRepository checklistRepository;

    public AiController(AiGrpcClientService aiGrpcClientService, GoalService goalService,
                        UserService userService, ChecklistRepository checklistRepository) {
        this.aiGrpcClientService = aiGrpcClientService;
        this.goalService = goalService;
        this.userService = userService;
        this.checklistRepository = checklistRepository;
    }

    @PostMapping("/smart-goal-suggestion")
    public ResponseEntity<SmartGoalSuggestionResponse> suggestSmartField(
            @Valid @RequestBody SmartGoalSuggestionRequest request) {
        User user = userService.getCurrentUser();
        String suggestion = aiGrpcClientService.suggestSmartField(
                request.field(), request.goalTitle(), request.goalDescription(),
                request.existingFields() != null ? request.existingFields() : Map.of(),
                ProfileUtils.buildUserProfile(user),
                request.stepsTaken());
        return ResponseEntity.ok(new SmartGoalSuggestionResponse(suggestion));
    }

    @PostMapping("/checklist-item")
    public ResponseEntity<AiChecklistItemResponse> generateChecklistItem(
            @Valid @RequestBody ChecklistItemSuggestionRequest request) {
        User user = userService.getCurrentUser();
        Goal goal = getOwnedGoal(request.goalId(), user);

        List<ChecklistItem> allItems = checklistRepository.findChecklistItemByGoalId(goal.getGoalId());
        List<String> activeItems = allItems.stream()
                .filter(i -> !i.isCompleted())
                .map(ChecklistItem::getTitle)
                .collect(Collectors.toList());
        List<String> completedItems = allItems.stream()
                .filter(ChecklistItem::isCompleted)
                .map(ChecklistItem::getTitle)
                .collect(Collectors.toList());

        ChecklistItemResponse item = aiGrpcClientService.generateChecklistItem(
                goal.getTitle(), goal.getDescription(),
                activeItems, completedItems,
                ProfileUtils.buildGoalSmartContext(goal), ProfileUtils.buildUserProfile(user));
        return ResponseEntity.ok(new AiChecklistItemResponse(item.getTitle(), item.getNotes(), item.getDeadline()));
    }

    @PostMapping("/full-checklist")
    public ResponseEntity<List<AiChecklistItemResponse>> generateFullChecklist(
            @Valid @RequestBody FullChecklistSuggestionRequest request) {
        User user = userService.getCurrentUser();
        Goal goal = getOwnedGoal(request.goalId(), user);

        List<String> completedItems = checklistRepository.findChecklistItemByGoalId(goal.getGoalId())
                .stream()
                .filter(ChecklistItem::isCompleted)
                .map(ChecklistItem::getTitle)
                .collect(Collectors.toList());

        List<AiChecklistItemResponse> items = aiGrpcClientService.generateFullChecklist(
                        goal.getTitle(), goal.getDescription(),
                        completedItems, ProfileUtils.buildGoalSmartContext(goal), ProfileUtils.buildUserProfile(user))
                .getItemsList()
                .stream()
                .map(i -> new AiChecklistItemResponse(i.getTitle(), i.getNotes(), i.getDeadline()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    private Goal getOwnedGoal(Long goalId, User currentUser) {
        Goal goal = goalService.getGoal(goalId);
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to use this goal");
        }
        return goal;
    }

}
