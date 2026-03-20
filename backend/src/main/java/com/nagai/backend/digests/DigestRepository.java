package com.nagai.backend.digests;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DigestRepository extends JpaRepository<Digest, Long> {
    Optional<Digest> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    List<Digest> findByActiveAndNextDeliveryAtBefore(boolean active, LocalDateTime time);
    Optional<Digest> findByUnsubscribeToken(String unsubscribeToken);
}
