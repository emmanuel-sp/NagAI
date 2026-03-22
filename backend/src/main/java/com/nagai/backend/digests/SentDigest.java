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
@Table(name = "sent_digests")
public class SentDigest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sent_digest_id")
    private Long sentDigestId;

    @Column(name = "digest_id", nullable = false)
    private Long digestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String subject;

    private String content;

    @Column(name = "sent_at")
    @CreationTimestamp
    private LocalDateTime sentAt;
}
