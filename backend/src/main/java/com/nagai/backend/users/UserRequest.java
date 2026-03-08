package com.nagai.backend.users;

import lombok.Data;

@Data
public class UserRequest {
    private String fullName;
    private String bio;
    private String phoneNumber;
    private String userLocation;
    private String career;
    private String[] interests;
    private String[] hobbies;
    private String[] habits;
}
