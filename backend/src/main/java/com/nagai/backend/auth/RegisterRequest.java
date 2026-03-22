package com.nagai.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "name is required") @Size(max = 100) String name,
    @NotBlank(message = "email is required") @Email(message = "must be a valid email") @Size(max = 255) String email,
    @NotBlank(message = "password is required") @Size(min = 8, max = 128, message = "password must be between 8 and 128 characters") String password
) {}
