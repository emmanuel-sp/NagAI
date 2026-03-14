package com.nagai.backend.agents;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AgentContextRepository extends JpaRepository<AgentContext, Long> {
    List<AgentContext> findByAgentId(Long agentId);

    @Query("SELECT ac FROM AgentContext ac JOIN Agent a ON ac.agentId = a.agentId WHERE a.deployed = true")
    List<AgentContext> findAllForDeployedAgents();
}
