package com.nagai.backend.chat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatResponse {
    private Long sessionId;
    private Long messageId;
    private String content;
    private String sessionTitle;
    private String suggestions;  // JSON string of ActionSuggestion list
}
