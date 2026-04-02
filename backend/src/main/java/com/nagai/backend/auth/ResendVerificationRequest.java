package com.nagai.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResendVerificationRequest(
    @NotBlank(message = "email is required")
    @Email(message = "must be a valid email")
    @Size(max = 255)
    String email
) {}
