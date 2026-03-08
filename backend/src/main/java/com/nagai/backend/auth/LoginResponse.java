package com.nagai.backend.auth;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private long expiresIn;
}
