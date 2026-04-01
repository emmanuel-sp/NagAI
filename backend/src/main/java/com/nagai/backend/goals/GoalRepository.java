package com.nagai.backend.goals;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<Goal, Long>  {
    List<Goal> findAllByUserId(Long userId);
    long countByUserId(Long userId);
    List<Goal> findAllByGoalIdIn(Collection<Long> goalIds);
}
