package com.nagai.backend.agents;

import lombok.Data;

@Data
public class UpdateContextRequest {
    private String name;
    private Long goalId;
    private String messageType;
    private String customInstructions;
}
