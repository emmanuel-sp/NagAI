package com.nagai.backend.checklists;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ChecklistRepository extends JpaRepository<ChecklistItem, Long> {
    @Query("SELECT c from ChecklistItem c WHERE c.goalId = :goalId")
    List<ChecklistItem> findChecklistItemByGoalId(Long goalId);

    @Query("SELECT c from ChecklistItem c WHERE c.goalId = :goalId ORDER BY c.sortOrder ASC, c.checklistId ASC")
    List<ChecklistItem> findChecklistItemByGoalIdOrderBySortOrder(Long goalId);

    @Query("""
        SELECT c from ChecklistItem c
        WHERE c.goalId IN :goalIds
        ORDER BY c.goalId ASC, c.sortOrder ASC, c.checklistId ASC
        """)
    List<ChecklistItem> findChecklistItemsByGoalIds(@org.springframework.data.repository.query.Param("goalIds") Collection<Long> goalIds);
}
