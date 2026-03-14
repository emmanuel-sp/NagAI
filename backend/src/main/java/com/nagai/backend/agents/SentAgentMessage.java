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
@Table(name = "sent_agent_messages")
public class SentAgentMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sent_message_id")
    private Long sentMessageId;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String subject;

    private String content;

    @Column(name = "email_message_id")
    private String emailMessageId;

    @Column(name = "sent_at")
    @CreationTimestamp
    private LocalDateTime sentAt;
}
