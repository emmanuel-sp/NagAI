package com.nagai.backend.ai;

import com.nagai.ai.ChecklistItemResponse;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
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

import java.util.Collections;
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
                buildUserProfile(user));
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
                buildGoalSmartContext(goal), buildUserProfile(user));
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
                        completedItems, buildGoalSmartContext(goal), buildUserProfile(user))
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

    private String buildUserProfile(User user) {
        StringBuilder sb = new StringBuilder();
        if (user.getAge() != null)
            sb.append("Age: ").append(user.getAge()).append("\n");
        if (user.getCareer() != null && !user.getCareer().isBlank())
            sb.append("Career: ").append(user.getCareer()).append("\n");
        if (user.getBio() != null && !user.getBio().isBlank())
            sb.append("About: ").append(user.getBio()).append("\n");
        if (user.getInterests() != null && user.getInterests().length > 0)
            sb.append("Interests: ").append(String.join(", ", user.getInterests())).append("\n");
        if (user.getHobbies() != null && user.getHobbies().length > 0)
            sb.append("Hobbies: ").append(String.join(", ", user.getHobbies())).append("\n");
        if (user.getHabits() != null && user.getHabits().length > 0)
            sb.append("Habits: ").append(String.join(", ", user.getHabits())).append("\n");
        if (user.getLifeContext() != null && !user.getLifeContext().isBlank())
            sb.append("Life context: ").append(user.getLifeContext()).append("\n");
        return sb.toString().trim();
    }

    private String buildGoalSmartContext(Goal goal) {
        StringBuilder sb = new StringBuilder();
        if (goal.getSpecific() != null && !goal.getSpecific().isBlank())
            sb.append("Specific: ").append(goal.getSpecific()).append("\n");
        if (goal.getMeasurable() != null && !goal.getMeasurable().isBlank())
            sb.append("Measurable: ").append(goal.getMeasurable()).append("\n");
        if (goal.getAttainable() != null && !goal.getAttainable().isBlank())
            sb.append("Attainable: ").append(goal.getAttainable()).append("\n");
        if (goal.getRelevant() != null && !goal.getRelevant().isBlank())
            sb.append("Relevant: ").append(goal.getRelevant()).append("\n");
        if (goal.getTimely() != null && !goal.getTimely().isBlank())
            sb.append("Timely: ").append(goal.getTimely()).append("\n");
        return sb.toString().trim();
    }
}
