package com.nagai.backend.checklists;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.ChecklistNotFoundException;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalService;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@Service
public class ChecklistService {
    private final ChecklistRepository checklistRepository;
    private final GoalService goalService;
    private final UserService userService;

    public ChecklistService(ChecklistRepository checklistRepository, GoalService goalService, UserService userService) {
        this.checklistRepository = checklistRepository;
        this.goalService = goalService;
        this.userService = userService;
    }

    public List<ChecklistResponse> fetchGoalChecklist(Long goalId) {
        List<ChecklistItem> checklists = checklistRepository.findChecklistItemByGoalId(goalId);
        return checklists.stream().map(ChecklistResponse::fromEntity).toList();
    }

    public ChecklistResponse addChecklistItem(ChecklistAddRequest request) {
        Goal goal = goalService.getGoal(request.getGoalId());
        User currentUser = userService.getCurrentUser();
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to add items to this goal's checklist");
        }

        ChecklistItem item = new ChecklistItem();
        item.setGoalId(request.getGoalId());
        item.setTitle(request.getTitle());
        item.setNotes(request.getNotes());
        item.setDeadline(request.getDeadline());
        item.setSortOrder(request.getSortOrder());
        item.setCompleted(false);

        return ChecklistResponse.fromEntity(checklistRepository.save(item));
    }

    public ChecklistResponse updateChecklistItem(ChecklistUpdateRequest request) {
        ChecklistItem item = checklistRepository.findById(request.getChecklistId())
                .orElseThrow(ChecklistNotFoundException::new);

        User currentUser = userService.getCurrentUser();
        Goal goal = goalService.getGoal(item.getGoalId());
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to update this checklist item");
        }

        item.setTitle(request.getTitle());
        item.setNotes(request.getNotes());
        item.setDeadline(request.getDeadline());
        if (request.getSortOrder() != null) {
            item.setSortOrder(request.getSortOrder());
        }
        if (request.getCompleted() != null) {
            item.setCompleted(request.getCompleted());
            item.setCompletedAt(request.getCompleted() ? LocalDateTime.now().toString() : null);
        }

        return ChecklistResponse.fromEntity(checklistRepository.save(item));
    }

    public void deleteChecklistItem(Long checklistId) {
        ChecklistItem item = checklistRepository.findById(checklistId)
                .orElseThrow(ChecklistNotFoundException::new);

        User currentUser = userService.getCurrentUser();
        Goal goal = goalService.getGoal(item.getGoalId());
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to delete this checklist item");
        }

        checklistRepository.delete(item);
    }

    public ChecklistResponse toggleComplete(Long checklistId) {
        ChecklistItem item = checklistRepository.findById(checklistId)
                .orElseThrow(ChecklistNotFoundException::new);

        User currentUser = userService.getCurrentUser();
        Goal goal = goalService.getGoal(item.getGoalId());
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to update this checklist item");
        }

        boolean newState = !item.isCompleted();
        item.setCompleted(newState);
        item.setCompletedAt(newState ? LocalDateTime.now().toString() : null);

        return ChecklistResponse.fromEntity(checklistRepository.save(item));
    }
}
