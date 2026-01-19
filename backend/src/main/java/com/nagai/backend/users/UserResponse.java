package com.nagai.backend.users;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserResponse {
    public UserResponse(User user) {
        this.id = user.getUserId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.createdAt = user.getCreatedAt();
        this.phoneNumber = user.getPhoneNumber();
        this.userLocation = user.getUserLocation();
        this.password = user.getPassword();
        this.career = user.getCareer();
        this.bio = user.getBio();
        this.interests = user.getInterests();
        this.hobbies = user.getHobbies();
        this.habits = user.getHabits();
    }

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
