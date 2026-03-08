package com.nagai.backend.digests;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DigestRepository extends JpaRepository<Digest, Long> {
    Optional<Digest> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
