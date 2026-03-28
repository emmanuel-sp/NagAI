package com.nagai.backend.chat;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ChatSessionResponse {
    private Long sessionId;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ChatSessionResponse fromEntity(ChatSession session) {
        ChatSessionResponse response = new ChatSessionResponse();
        response.setSessionId(session.getSessionId());
        response.setTitle(session.getTitle());
        response.setCreatedAt(session.getCreatedAt());
        response.setUpdatedAt(session.getUpdatedAt());
        return response;
    }
}
