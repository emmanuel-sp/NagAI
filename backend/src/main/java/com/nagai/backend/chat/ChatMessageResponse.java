package com.nagai.backend.chat;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ChatMessageResponse {
    private Long messageId;
    private String role;
    private String content;
    private LocalDateTime createdAt;

    public static ChatMessageResponse fromEntity(ChatMessage message) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setMessageId(message.getMessageId());
        response.setRole(message.getRole());
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}
