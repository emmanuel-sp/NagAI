package com.nagai.backend.dailychecklist;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyChecklistItemRepository extends JpaRepository<DailyChecklistItem, Long> {
    List<DailyChecklistItem> findByDailyChecklistIdOrderBySortOrder(Long dailyChecklistId);

    List<DailyChecklistItem> findByParentChecklistId(Long parentChecklistId);

    long countByParentChecklistIdAndCompletedAndDailyItemIdNot(
            Long parentChecklistId, boolean completed, Long dailyItemId);
}
