package com.nagai.backend.agents;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "agent_contexts")
public class AgentContext {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "context_id")
    private Long contextId;

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Column(name = "goal_id", nullable = false)
    private Long goalId;

    @Column(nullable = false)
    private String name;

    @Column(name = "message_type", nullable = false)
    private String messageType;

    @Column(name = "custom_instructions")
    private String customInstructions;

    @Column(nullable = false)
    private boolean deployed = false;

    @Column(name = "last_message_sent_at")
    private LocalDateTime lastMessageSentAt;

    @Column(name = "next_message_at")
    private LocalDateTime nextMessageAt;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
