package com.nagai.backend.agents;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateContextRequest {
    @Size(max = 100)
    private String name;

    @NotNull(message = "goalId is required")
    private Long goalId;

    @Size(max = 50)
    private String messageType;

    @Size(max = 2000)
    private String customInstructions;
}
