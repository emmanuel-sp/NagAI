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
        this.career = user.getCareer();
        this.bio = user.getBio();
        this.interests = user.getInterests();
        this.hobbies = user.getHobbies();
        this.habits = user.getHabits();
        this.age = user.getAge();
        this.lifeContext = user.getLifeContext();
        this.timezone = user.getTimezone();
        this.onboardingCompleted = user.isOnboardingCompleted();
    }

    private Long id;
    
    private String fullName;

    private String email;

    private LocalDateTime createdAt;

    private String phoneNumber;

    private String userLocation;

    private String career;

    private String bio;

    private String[] interests; 

    private String[] hobbies;

    private String[] habits;
    private Integer age;
    private String lifeContext;
    private String timezone;
    private boolean onboardingCompleted;
}
