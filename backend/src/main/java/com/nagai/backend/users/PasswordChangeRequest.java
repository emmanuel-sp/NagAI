package com.nagai.backend.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordChangeRequest {
    @NotBlank(message = "currentPassword is required")
    @Size(max = 128)
    private String currentPassword;

    @NotBlank(message = "newPassword is required")
    @Size(min = 8, max = 128, message = "password must be between 8 and 128 characters")
    private String newPassword;
}
