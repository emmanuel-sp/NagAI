package com.nagai.backend.dailychecklist;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyChecklistRepository extends JpaRepository<DailyChecklist, Long> {
    Optional<DailyChecklist> findByUserIdAndPlanDate(Long userId, LocalDate planDate);
}
