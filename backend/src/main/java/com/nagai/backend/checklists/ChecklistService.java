package com.nagai.backend.checklists;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nagai.backend.agents.Agent;
import com.nagai.backend.agents.AgentCadence;
import com.nagai.backend.agents.AgentContext;
import com.nagai.backend.agents.AgentContextRepository;
import com.nagai.backend.agents.AgentRepository;
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
    private final AgentContextRepository agentContextRepository;
    private final AgentRepository agentRepository;

    public ChecklistService(ChecklistRepository checklistRepository, GoalService goalService, UserService userService,
                            DailyChecklistItemRepository dailyItemRepository,
                            AgentContextRepository agentContextRepository,
                            AgentRepository agentRepository) {
        this.checklistRepository = checklistRepository;
        this.goalService = goalService;
        this.userService = userService;
        this.dailyItemRepository = dailyItemRepository;
        this.agentContextRepository = agentContextRepository;
        this.agentRepository = agentRepository;
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

    @Transactional
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
        item.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : (long) existing.size());
        item.setCompleted(false);

        ChecklistResponse response = ChecklistResponse.fromEntity(checklistRepository.save(item));
        touchAgentContextsForGoal(request.getGoalId());
        return response;
    }

    @Transactional
    public List<ChecklistResponse> reorderItems(Long goalId, ChecklistReorderRequest request) {
        Goal goal = goalService.getGoal(goalId);
        User currentUser = userService.getCurrentUser();
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to update this checklist item");
        }

        List<ChecklistItem> items = checklistRepository.findChecklistItemByGoalIdOrderBySortOrder(goalId);
        List<Long> expectedIds = items.stream()
                .map(ChecklistItem::getChecklistId)
                .toList();
        List<Long> datedIds = items.stream()
                .filter(item -> item.getDeadline() != null && !item.getDeadline().isBlank())
                .map(ChecklistItem::getChecklistId)
                .toList();
        List<Long> safeSubmitted = validateReorderPayload(request.getOrderedItemIds(), expectedIds);
        List<Long> submittedDatedIds = safeSubmitted.stream()
                .filter(datedIds::contains)
                .toList();
        if (!submittedDatedIds.equals(datedIds)) {
            throw new ChecklistException("Dated checklist items must keep their relative order");
        }

        applyReorder(items, safeSubmitted);
        List<ChecklistItem> updatedItems = checklistRepository.saveAll(items);
        touchAgentContextsForGoal(goalId);
        return updatedItems.stream()
                .sorted(java.util.Comparator.comparingLong(ChecklistItem::getSortOrder))
                .map(ChecklistResponse::fromEntity).toList();
    }

    @Transactional
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

        ChecklistResponse response = ChecklistResponse.fromEntity(checklistRepository.save(item));
        touchAgentContextsForGoal(item.getGoalId());
        return response;
    }

    @Transactional
    public void deleteChecklistItem(Long checklistId) {
        ChecklistItem item = checklistRepository.findById(checklistId)
                .orElseThrow(ChecklistNotFoundException::new);

        User currentUser = userService.getCurrentUser();
        Goal goal = goalService.getGoal(item.getGoalId());
        if (!currentUser.getUserId().equals(goal.getUserId())) {
            throw new AccessDeniedException("You do not have permission to delete this checklist item");
        }

        checklistRepository.delete(item);
        touchAgentContextsForGoal(item.getGoalId());
    }

    @Transactional
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
        touchAgentContextsForGoal(item.getGoalId());

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

    private List<Long> validateReorderPayload(List<Long> submittedIds, List<Long> expectedIds) {
        List<Long> safeSubmitted = submittedIds == null ? List.of() : submittedIds;
        if (safeSubmitted.size() != expectedIds.size()) {
            throw new ChecklistException("Checklist reorder payload is invalid");
        }

        Set<Long> submittedSet = new HashSet<>(safeSubmitted);
        Set<Long> expectedSet = new HashSet<>(expectedIds);
        if (submittedSet.size() != safeSubmitted.size() || !submittedSet.equals(expectedSet)) {
            throw new ChecklistException("Checklist reorder payload is invalid");
        }
        return safeSubmitted;
    }

    private void applyReorder(List<ChecklistItem> items, List<Long> orderedItemIds) {
        java.util.Map<Long, ChecklistItem> itemsById = items.stream()
                .collect(java.util.stream.Collectors.toMap(ChecklistItem::getChecklistId, item -> item));
        long nextSortOrder = 0;
        for (Long orderedItemId : orderedItemIds) {
            ChecklistItem reordered = itemsById.get(orderedItemId);
            reordered.setSortOrder(nextSortOrder++);
        }
    }

    private void touchAgentContextsForGoal(Long goalId) {
        List<AgentContext> contexts = agentContextRepository.findByGoalId(goalId);
        if (contexts == null || contexts.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        Set<Long> resumedAgentIds = new HashSet<>();

        for (AgentContext context : contexts) {
            context.setLastChecklistActivityAt(now);

            if (AgentCadence.PAUSE_REASON_STALE_PROGRESS.equals(context.getPauseReason())) {
                context.setDeployed(true);
                context.setPauseReason(null);
                context.setStaleCount(0);
                context.setNextMessageAt(now.plusHours(AgentCadence.baseIntervalHours(context.getMessageType())));
                context.setProcessingStartedAt(null);
                resumedAgentIds.add(context.getAgentId());
                continue;
            }

            if (context.isDeployed()) {
                context.setStaleCount(0);
                LocalDateTime responsiveAt = now.plusHours(AgentCadence.baseIntervalHours(context.getMessageType()));
                if (context.getNextMessageAt() == null || context.getNextMessageAt().isAfter(responsiveAt)) {
                    context.setNextMessageAt(responsiveAt);
                }
            }
        }

        agentContextRepository.saveAll(contexts);
        syncResumedAgentFlags(resumedAgentIds);
    }

    private void syncResumedAgentFlags(Set<Long> agentIds) {
        for (Long agentId : agentIds) {
            Agent agent = agentRepository.findById(agentId).orElse(null);
            if (agent == null) {
                continue;
            }
            boolean anyDeployed = agentContextRepository.findByAgentId(agentId).stream()
                    .anyMatch(AgentContext::isDeployed);
            agent.setDeployed(anyDeployed);
            agentRepository.save(agent);
        }
    }
}
