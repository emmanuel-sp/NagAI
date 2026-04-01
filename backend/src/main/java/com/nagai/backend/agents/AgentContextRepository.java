package com.nagai.backend.agents;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface AgentContextRepository extends JpaRepository<AgentContext, Long> {
    List<AgentContext> findByAgentId(Long agentId);
    boolean existsByAgentIdAndGoalId(Long agentId, Long goalId);

    @Query("SELECT ac FROM AgentContext ac WHERE ac.deployed = true")
    List<AgentContext> findAllForDeployedAgents();

    @Query("SELECT ac FROM AgentContext ac WHERE ac.deployed = true AND (ac.nextMessageAt IS NULL OR ac.nextMessageAt <= :now)")
    List<AgentContext> findDueForDeployedAgents(@Param("now") LocalDateTime now);

    @Transactional
    @Modifying
    @Query("""
        update AgentContext ac
        set ac.processingStartedAt = :claimTime
        where ac.contextId = :contextId
          and ac.deployed = true
          and (ac.nextMessageAt is null or ac.nextMessageAt <= :now)
          and (ac.processingStartedAt is null or ac.processingStartedAt < :staleBefore)
        """)
    int claimDueContext(
        @Param("contextId") Long contextId,
        @Param("now") LocalDateTime now,
        @Param("claimTime") LocalDateTime claimTime,
        @Param("staleBefore") LocalDateTime staleBefore
    );

    @Transactional
    @Modifying
    @Query("update AgentContext ac set ac.processingStartedAt = null where ac.contextId = :contextId")
    int clearProcessingClaim(@Param("contextId") Long contextId);
}
