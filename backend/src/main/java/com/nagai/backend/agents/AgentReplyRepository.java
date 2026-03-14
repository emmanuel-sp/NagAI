package com.nagai.backend.agents;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentReplyRepository extends JpaRepository<AgentReply, Long> {
    List<AgentReply> findBySentMessageIdIn(List<Long> sentMessageIds);
}
