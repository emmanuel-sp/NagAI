package com.nagai.backend.agents;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommunicationChannelRequest {
    @NotBlank(message = "channel is required")
    private String channel;
}
