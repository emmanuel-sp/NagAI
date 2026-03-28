package com.nagai.backend.chat;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.nagai.ai.AgentChatResponse;
import com.nagai.ai.ChatGoalSummary;
import com.nagai.ai.ChatHistoryEntry;
import com.nagai.backend.agents.AgentContext;
import com.nagai.backend.agents.AgentContextRepository;
import com.nagai.backend.agents.AgentRepository;
import com.nagai.backend.agents.SentAgentMessage;
import com.nagai.backend.agents.SentAgentMessageRepository;
import com.nagai.backend.ai.AiGrpcClientService;
import com.nagai.backend.checklists.ChecklistItem;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.common.ProfileUtils;
import com.nagai.backend.goals.Goal;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@Service
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GoalRepository goalRepository;
    private final ChecklistRepository checklistRepository;
    private final AgentContextRepository agentContextRepository;
    private final AgentRepository agentRepository;
    private final SentAgentMessageRepository sentAgentMessageRepository;
    private final UserService userService;
    private final AiGrpcClientService aiGrpcClientService;

    public ChatService(ChatSessionRepository chatSessionRepository,
                       ChatMessageRepository chatMessageRepository,
                       GoalRepository goalRepository,
                       ChecklistRepository checklistRepository,
                       AgentContextRepository agentContextRepository,
                       AgentRepository agentRepository,
                       SentAgentMessageRepository sentAgentMessageRepository,
                       UserService userService,
                       AiGrpcClientService aiGrpcClientService) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.goalRepository = goalRepository;
        this.checklistRepository = checklistRepository;
        this.agentContextRepository = agentContextRepository;
        this.agentRepository = agentRepository;
        this.sentAgentMessageRepository = sentAgentMessageRepository;
        this.userService = userService;
        this.aiGrpcClientService = aiGrpcClientService;
    }

    public ChatResponse sendMessage(ChatRequest request) {
        User user = userService.getCurrentUser();

        // Create or fetch session
        ChatSession session;
        boolean isNewSession = (request.getSessionId() == null);
        if (isNewSession) {
            session = new ChatSession();
            session.setUserId(user.getUserId());
            session = chatSessionRepository.save(session);
        } else {
            session = chatSessionRepository.findById(request.getSessionId())
                    .filter(s -> s.getUserId().equals(user.getUserId()))
                    .orElseThrow(() -> new RuntimeException("Session not found"));
        }

        // Save user message
        ChatMessage userMessage = new ChatMessage();
        userMessage.setSessionId(session.getSessionId());
        userMessage.setRole("user");
        userMessage.setContent(request.getMessage());
        chatMessageRepository.save(userMessage);

        // Build context for AI
        String userProfile = ProfileUtils.buildUserProfile(user);
        List<ChatGoalSummary> goalSummaries = buildGoalSummaries(user.getUserId());
        List<ChatHistoryEntry> history = buildHistory(session.getSessionId());

        // Call AI via gRPC
        String contextSummary = request.getFromContextSummary() != null
                ? request.getFromContextSummary() : "";
        AgentChatResponse aiResponse = aiGrpcClientService.agentChat(
                request.getMessage(), userProfile, goalSummaries, history, contextSummary);

        String assistantContent = aiResponse.getAssistantMessage();

        // Save assistant message
        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setSessionId(session.getSessionId());
        assistantMessage.setRole("assistant");
        assistantMessage.setContent(assistantContent);
        chatMessageRepository.save(assistantMessage);

        // Auto-generate title from first user message
        if (isNewSession) {
            String title = request.getMessage();
            if (title.length() > 50) {
                title = title.substring(0, 47) + "...";
            }
            session.setTitle(title);
            chatSessionRepository.save(session);
        }

        return ChatResponse.builder()
                .sessionId(session.getSessionId())
                .messageId(assistantMessage.getMessageId())
                .content(assistantContent)
                .sessionTitle(session.getTitle())
                .build();
    }

    public List<ChatSessionResponse> getSessions() {
        User user = userService.getCurrentUser();
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(user.getUserId()).stream()
                .map(ChatSessionResponse::fromEntity)
                .toList();
    }

    public List<ChatMessageResponse> getSessionMessages(Long sessionId) {
        User user = userService.getCurrentUser();
        ChatSession session = chatSessionRepository.findById(sessionId)
                .filter(s -> s.getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getSessionId()).stream()
                .map(ChatMessageResponse::fromEntity)
                .toList();
    }

    public void deleteSession(Long sessionId) {
        User user = userService.getCurrentUser();
        ChatSession session = chatSessionRepository.findById(sessionId)
                .filter(s -> s.getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new RuntimeException("Session not found"));
        chatSessionRepository.delete(session);
    }

    public String getContextSummary(Long contextId) {
        User user = userService.getCurrentUser();
        AgentContext context = agentContextRepository.findById(contextId).orElse(null);
        if (context == null) return "";

        // Verify ownership: context → agent → user
        var agent = agentRepository.findById(context.getAgentId()).orElse(null);
        if (agent == null || !agent.getUserId().equals(user.getUserId())) return "";

        List<SentAgentMessage> recent = sentAgentMessageRepository
                .findTop5ByContextIdOrderBySentAtDesc(contextId);
        if (recent.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        sb.append("Context: ").append(context.getName()).append("\n");
        sb.append("Type: ").append(context.getMessageType()).append("\n\n");
        sb.append("Recent agent emails (oldest first):\n");

        // Show up to 2 most recent, in chronological order
        int start = Math.min(recent.size(), 2);
        for (int i = start - 1; i >= 0; i--) {
            SentAgentMessage msg = recent.get(i);
            sb.append("---\n");
            if (msg.getSentAt() != null) {
                sb.append("Sent: ").append(msg.getSentAt()).append("\n");
            }
            if (msg.getSubject() != null) {
                sb.append("Subject: ").append(msg.getSubject()).append("\n");
            }
            if (msg.getContent() != null) {
                String content = msg.getContent();
                if (content.length() > 500) content = content.substring(0, 497) + "...";
                sb.append(content).append("\n");
            }
        }
        return sb.toString();
    }

    private List<ChatGoalSummary> buildGoalSummaries(Long userId) {
        List<Goal> goals = goalRepository.findAllByUserId(userId);
        List<ChatGoalSummary> summaries = new ArrayList<>();

        for (Goal goal : goals) {
            List<ChecklistItem> items = checklistRepository.findChecklistItemByGoalId(goal.getGoalId());
            List<String> activeItems = items.stream()
                    .filter(i -> !i.isCompleted())
                    .map(ChecklistItem::getTitle)
                    .limit(5)
                    .toList();
            int completedCount = (int) items.stream().filter(ChecklistItem::isCompleted).count();

            summaries.add(ChatGoalSummary.newBuilder()
                    .setTitle(goal.getTitle())
                    .setDescription(goal.getDescription() != null ? goal.getDescription() : "")
                    .setSmartContext(ProfileUtils.buildGoalSmartContext(goal))
                    .setCompletedItems(completedCount)
                    .setTotalItems(items.size())
                    .addAllActiveItems(activeItems)
                    .build());
        }
        return summaries;
    }

    private List<ChatHistoryEntry> buildHistory(Long sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(msg -> ChatHistoryEntry.newBuilder()
                        .setRole(msg.getRole())
                        .setContent(msg.getContent())
                        .build())
                .toList();
    }
}
