package com.nagai.backend.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "email is required") String email,
    @NotBlank(message = "password is required") String password
) {}
