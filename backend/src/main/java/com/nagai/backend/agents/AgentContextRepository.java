package com.nagai.backend.agents;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgentContextRepository extends JpaRepository<AgentContext, Long> {
    List<AgentContext> findByAgentId(Long agentId);

    @Query("SELECT ac FROM AgentContext ac JOIN Agent a ON ac.agentId = a.agentId WHERE a.deployed = true")
    List<AgentContext> findAllForDeployedAgents();

    @Query("SELECT ac FROM AgentContext ac JOIN Agent a ON ac.agentId = a.agentId " +
           "WHERE a.deployed = true AND (ac.nextMessageAt IS NULL OR ac.nextMessageAt < :now)")
    List<AgentContext> findDueForDeployedAgents(@Param("now") LocalDateTime now);
}
