package com.nagai.backend.dailychecklist;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyChecklistConfigRepository extends JpaRepository<DailyChecklistConfig, Long> {
    Optional<DailyChecklistConfig> findByUserId(Long userId);
}
