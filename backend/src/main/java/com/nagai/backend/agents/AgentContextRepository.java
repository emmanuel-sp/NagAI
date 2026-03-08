package com.nagai.backend.agents;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentContextRepository extends JpaRepository<AgentContext, Long> {
    List<AgentContext> findByAgentId(Long agentId);
}
