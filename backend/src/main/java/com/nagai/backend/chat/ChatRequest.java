package com.nagai.backend.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {
    private Long sessionId;

    @NotBlank
    @Size(max = 2000, message = "Message must be under 2000 characters")
    private String message;

    @Size(max = 1000, message = "Context summary too long")
    private String fromContextSummary;
}
