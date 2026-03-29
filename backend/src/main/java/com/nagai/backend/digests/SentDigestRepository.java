package com.nagai.backend.digests;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SentDigestRepository extends JpaRepository<SentDigest, Long> {
    List<SentDigest> findTop3ByUserIdOrderBySentAtDesc(Long userId);
    List<SentDigest> findByUserIdOrderBySentAtDesc(Long userId, Pageable pageable);
}
