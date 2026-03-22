package com.nagai.backend.agents;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByUserId(Long userId);
    Optional<Agent> findByUnsubscribeToken(String unsubscribeToken);
}
