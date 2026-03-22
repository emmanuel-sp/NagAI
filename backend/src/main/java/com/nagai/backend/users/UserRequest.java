package com.nagai.backend.users;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {
    @Size(max = 100)
    private String fullName;
    @Size(max = 2000)
    private String bio;
    @Size(max = 30)
    private String phoneNumber;
    @Size(max = 200)
    private String userLocation;
    @Size(max = 200)
    private String career;
    private String[] interests;
    private String[] hobbies;
    private String[] habits;
    private Integer age;
    @Size(max = 5000)
    private String lifeContext;
    @Size(max = 50)
    private String timezone;
}
