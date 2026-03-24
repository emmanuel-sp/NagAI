package com.nagai.backend.dailychecklist;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "daily_checklist_items")
public class DailyChecklistItem {

    @Id
    @Column(name = "daily_item_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dailyItemId;

    @Column(name = "daily_checklist_id")
    private Long dailyChecklistId;

    @Column(name = "parent_checklist_id")
    private Long parentChecklistId;

    @Column(name = "sort_order")
    private int sortOrder;

    private String title;

    private String notes;

    @Column(name = "scheduled_time")
    private String scheduledTime;

    private boolean completed;

    @Column(name = "completed_at")
    private String completedAt;
}
