package com.nagai.backend.agents;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SentAgentMessageRepository extends JpaRepository<SentAgentMessage, Long> {
    List<SentAgentMessage> findTop5ByContextIdOrderBySentAtDesc(Long contextId);
}
