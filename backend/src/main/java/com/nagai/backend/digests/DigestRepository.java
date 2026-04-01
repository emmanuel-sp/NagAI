package com.nagai.backend.digests;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface DigestRepository extends JpaRepository<Digest, Long> {
    Optional<Digest> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    List<Digest> findByActiveAndNextDeliveryAtBefore(boolean active, LocalDateTime time);
    Optional<Digest> findByUnsubscribeToken(String unsubscribeToken);
    Optional<Digest> findByUnsubscribeTokenHash(String unsubscribeTokenHash);

    @Transactional
    @Modifying
    @Query("""
        update Digest d
        set d.processingStartedAt = :claimTime
        where d.digestId = :digestId
          and d.active = true
          and d.nextDeliveryAt is not null
          and d.nextDeliveryAt <= :now
          and (d.processingStartedAt is null or d.processingStartedAt < :staleBefore)
        """)
    int claimDueDigest(
        @Param("digestId") Long digestId,
        @Param("now") LocalDateTime now,
        @Param("claimTime") LocalDateTime claimTime,
        @Param("staleBefore") LocalDateTime staleBefore
    );

    @Transactional
    @Modifying
    @Query("update Digest d set d.processingStartedAt = null where d.digestId = :digestId")
    int clearProcessingClaim(@Param("digestId") Long digestId);
}
