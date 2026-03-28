package com.nagai.backend.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatRequest {
    private Long sessionId;

    @NotBlank
    private String message;

    private String fromContextSummary;
}
