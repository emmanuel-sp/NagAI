package com.nagai.backend.checklists;

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
@Table(name="checklist_items")
public class ChecklistItem {

    
    @Id
    @Column(name="checklist_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long checklistId;

    @Column(name="goal_id")
    private Long goalId;
    @Column(name="sort_order")
    private Long sortOrder;
    private boolean completed;
    private String completedAt;
    private String title;
    private String notes;
    private String deadline;

    @Column(name="created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
}
