package com.nagai.backend.agents;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddContextRequest {
    @NotBlank(message = "name is required")
    @Size(max = 100)
    private String name;

    @NotNull(message = "goalId is required")
    private Long goalId;

    @NotBlank(message = "messageType is required")
    @Size(max = 50)
    private String messageType;

    @Size(max = 2000)
    private String customInstructions;
}
