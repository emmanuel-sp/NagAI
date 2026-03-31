package com.nagai.backend.dailychecklist;

import java.time.LocalDate;
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
@Table(name = "daily_checklists")
public class DailyChecklist {

    @Id
    @Column(name = "daily_checklist_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dailyChecklistId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "plan_date")
    private LocalDate planDate;

    @Column(name = "generated_at")
    @CreationTimestamp
    private LocalDateTime generatedAt;

    @Column(name = "generation_count")
    private Integer generationCount;
}
