package com.nagai.backend.users;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserRequest {

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
