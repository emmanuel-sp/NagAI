package com.nagai.backend.agents;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgentContextRepository extends JpaRepository<AgentContext, Long> {
    List<AgentContext> findByAgentId(Long agentId);
    boolean existsByAgentIdAndGoalId(Long agentId, Long goalId);

    @Query("SELECT ac FROM AgentContext ac WHERE ac.deployed = true")
    List<AgentContext> findAllForDeployedAgents();

    @Query("SELECT ac FROM AgentContext ac WHERE ac.deployed = true AND (ac.nextMessageAt IS NULL OR ac.nextMessageAt < :now)")
    List<AgentContext> findDueForDeployedAgents(@Param("now") LocalDateTime now);
}
