package com.nagai.backend.goals;
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
@Table(name="goals")
public class Goal {

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name="goal_id")
    private Long goalId;

    @Column(name="user_id")
    private Long userId;

    private String title;
    private String description;
    @Column(name="target_date")
    private String targetDate;
    private String specific;
    private String measurable;
    private String attainable;
    private String relevant;
    private String timely;

    @Column(name="created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
}
