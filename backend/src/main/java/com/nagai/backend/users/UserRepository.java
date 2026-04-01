package com.nagai.backend.users;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long>  {
    
    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByVerificationToken(String verificationToken);

    Optional<User> findByVerificationTokenHash(String verificationTokenHash);
}
