package com.nagai.backend.users;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name="users")
public class User implements UserDetails{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="user_id")
    private Long userId;
    
    private String fullName;

    @Column(unique = true, length = 100, nullable = false)
    private String email;

    @Column(name="created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name="phone_number")
    private String phoneNumber;

    @Column(name="user_location")
    private String userLocation;

    private String password;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "email_verified")
    private boolean emailVerified = false;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verification_token_expiry")
    private LocalDateTime verificationTokenExpiry;

    private String career;

    private String bio;

    private String[] interests; 

    private String[] hobbies;

    private String[] habits;

    private Integer age;

    @Column(name = "life_context", columnDefinition = "TEXT")
    private String lifeContext;

    @Column(length = 50)
    private String timezone = "UTC";

    @Column(name = "onboarding_completed")
    private boolean onboardingCompleted = false;

    @Column(name = "google_calendar_refresh_token", columnDefinition = "TEXT")
    private String googleCalendarRefreshToken;

    @Column(name = "google_calendar_access_token", columnDefinition = "TEXT")
    private String googleCalendarAccessToken;

    @Column(name = "google_calendar_token_expiry")
    private LocalDateTime googleCalendarTokenExpiry;

    public boolean isCalendarConnected() {
        return googleCalendarRefreshToken != null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
