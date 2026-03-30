package com.nagai.backend.dailychecklist;

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
@Table(name = "daily_checklist_config")
public class DailyChecklistConfig {

    @Id
    @Column(name = "config_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long configId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "max_items")
    private int maxItems = 10;

    @Column(name = "recurring_items")
    private String recurringItems;

    @Column(name = "included_goal_ids")
    private String includedGoalIds;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "calendar_enabled")
    private boolean calendarEnabled = true;
}
