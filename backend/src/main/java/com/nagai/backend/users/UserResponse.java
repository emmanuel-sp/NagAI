package com.nagai.backend.users;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.nagai.backend.common.ApiResponse;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class UserResponse extends ApiResponse {
    private Long id;
    
    private String fullName;

    private String email;

    private LocalDateTime createdAt;

    private String phoneNumber;

    private String userLocation;

    private String password;

    private String career;

    private String bio;

    private String[] interests; 

    private String[] hobbies;

    private String[] habits;
}
