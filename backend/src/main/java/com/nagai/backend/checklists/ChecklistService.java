package com.nagai.backend.checklists;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.nagai.backend.dailychecklist.DailyChecklistItem;
import com.nagai.backend.dailychecklist.DailyChecklistItemRepository;

import com.nagai.backend.exceptions.ChecklistException;
import com.nagai.backend.exceptions.ChecklistLimitException;
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
    private final DailyChecklistItemRepository dailyItemRepository;

    public ChecklistService(ChecklistRepository checklistRepository, GoalService goalService, UserService userService,
                            DailyChecklistItemRepository dailyItemRepository) {
        this.checklistRepository = checklistRepository;
        this.goalService = goalService;
        this.userService = userService;
        this.dailyItemRepository = dailyItemRepository;
    }

    public List<ChecklistResponse> fetchGoalChecklist(Long goalId) {
        Goal goal = goalService.getGoal(goalId);
        User currentUser = userService.getCurrentUser();
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to view this goal's checklist");
        }
        List<ChecklistItem> checklists = checklistRepository.findChecklistItemByGoalIdOrderBySortOrder(goalId);
        return checklists.stream().map(ChecklistResponse::fromEntity).toList();
    }

    private static final int MAX_CHECKLIST_ITEMS = 20;

    public ChecklistResponse addChecklistItem(ChecklistAddRequest request) {
        Goal goal = goalService.getGoal(request.getGoalId());
        User currentUser = userService.getCurrentUser();
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to add items to this goal's checklist");
        }

        List<ChecklistItem> existing = checklistRepository.findChecklistItemByGoalIdOrderBySortOrder(request.getGoalId());
        if (existing.size() >= MAX_CHECKLIST_ITEMS) {
            throw new ChecklistLimitException();
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

    public List<ChecklistResponse> reorderUndatedItems(Long goalId, ChecklistReorderRequest request) {
        Goal goal = goalService.getGoal(goalId);
        User currentUser = userService.getCurrentUser();
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to update this checklist item");
        }

        List<ChecklistItem> items = checklistRepository.findChecklistItemByGoalIdOrderBySortOrder(goalId);
        List<ChecklistItem> movableItems = items.stream()
                .filter(item -> item.getDeadline() == null || item.getDeadline().isBlank())
                .toList();
        List<Long> expectedIds = movableItems.stream()
                .map(ChecklistItem::getChecklistId)
                .toList();
        validateReorderPayload(request.getOrderedItemIds(), expectedIds);

        applyReorder(items, request.getOrderedItemIds());
        List<ChecklistItem> updatedItems = checklistRepository.saveAll(items);
        return updatedItems.stream()
                .sorted(java.util.Comparator.comparingLong(ChecklistItem::getSortOrder))
                .map(ChecklistResponse::fromEntity).toList();
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
        checklistRepository.save(item);

        // Reverse sync: propagate to linked daily checklist items
        syncLinkedDailyItems(checklistId, newState);

        return ChecklistResponse.fromEntity(item);
    }

    private void syncLinkedDailyItems(Long checklistId, boolean newState) {
        List<DailyChecklistItem> linkedItems = dailyItemRepository.findByParentChecklistId(checklistId);
        for (DailyChecklistItem dailyItem : linkedItems) {
            dailyItem.setCompleted(newState);
            dailyItem.setCompletedAt(newState ? LocalDateTime.now().toString() : null);
        }
        dailyItemRepository.saveAll(linkedItems);
    }

    private void validateReorderPayload(List<Long> submittedIds, List<Long> expectedIds) {
        List<Long> safeSubmitted = submittedIds == null ? List.of() : submittedIds;
        if (safeSubmitted.size() != expectedIds.size()) {
            throw new ChecklistException("Only undated checklist items can be reordered");
        }

        Set<Long> submittedSet = new HashSet<>(safeSubmitted);
        Set<Long> expectedSet = new HashSet<>(expectedIds);
        if (submittedSet.size() != safeSubmitted.size() || !submittedSet.equals(expectedSet)) {
            throw new ChecklistException("Only undated checklist items can be reordered");
        }
    }

    private void applyReorder(List<ChecklistItem> items, List<Long> orderedItemIds) {
        List<ChecklistItem> movableItems = items.stream()
                .filter(item -> item.getDeadline() == null || item.getDeadline().isBlank())
                .toList();
        java.util.Map<Long, ChecklistItem> movableById = movableItems.stream()
                .collect(java.util.stream.Collectors.toMap(ChecklistItem::getChecklistId, item -> item));

        int movableIndex = 0;
        long nextSortOrder = 0;
        for (ChecklistItem item : items) {
            if (item.getDeadline() == null || item.getDeadline().isBlank()) {
                ChecklistItem reordered = movableById.get(orderedItemIds.get(movableIndex++));
                reordered.setSortOrder(nextSortOrder++);
            } else {
                item.setSortOrder(nextSortOrder++);
            }
        }
    }
}
