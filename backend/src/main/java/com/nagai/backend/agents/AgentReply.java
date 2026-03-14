package com.nagai.backend.agents;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "agent_replies")
public class AgentReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reply_id")
    private Long replyId;

    @Column(name = "sent_message_id", nullable = false)
    private Long sentMessageId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String content;

    @Column(name = "received_at")
    @CreationTimestamp
    private LocalDateTime receivedAt;

    @Column(nullable = false)
    private boolean processed;
}
