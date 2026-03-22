package com.nagai.backend.digests;

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
@Table(name = "digests")
public class Digest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "digest_id")
    private Long digestId;

    @Column(name = "user_id", unique = true, nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String frequency;

    @Column(name = "delivery_time", nullable = false)
    private String deliveryTime;

    @Column(name = "content_types")
    private String[] contentTypes;

    @Column(nullable = false)
    private boolean active = false;

    @Column(name = "unsubscribe_token", unique = true)
    private String unsubscribeToken;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "last_delivered_at")
    private LocalDateTime lastDeliveredAt;

    @Column(name = "next_delivery_at")
    private LocalDateTime nextDeliveryAt;

    @Column(name = "stale_count", nullable = false)
    private int staleCount = 0;

    @Column(name = "pause_reason")
    private String pauseReason;
}
