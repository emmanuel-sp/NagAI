package com.nagai.backend.agents;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddContextRequest {
    @NotBlank(message = "name is required")
    private String name;

    private Long goalId;

    @NotBlank(message = "messageType is required")
    private String messageType;

    @NotBlank(message = "messageFrequency is required")
    private String messageFrequency;

    private String customInstructions;
}
