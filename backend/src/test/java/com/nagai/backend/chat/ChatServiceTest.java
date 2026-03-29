package com.nagai.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nagai.ai.ActionSuggestion;
import com.nagai.ai.AgentChatResponse;
import com.nagai.backend.agents.AgentContextRepository;
import com.nagai.backend.agents.AgentRepository;
import com.nagai.backend.agents.SentAgentMessageRepository;
import com.nagai.backend.ai.AiGrpcClientService;
import com.nagai.backend.checklists.ChecklistRepository;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ChatSessionRepository chatSessionRepository;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private GoalRepository goalRepository;
    @Mock private ChecklistRepository checklistRepository;
    @Mock private AgentContextRepository agentContextRepository;
    @Mock private AgentRepository agentRepository;
    @Mock private SentAgentMessageRepository sentAgentMessageRepository;
    @Mock private UserService userService;
    @Mock private AiGrpcClientService aiGrpcClientService;

    @InjectMocks
    private ChatService chatService;

    private User user;
    private ChatSession session;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");
        user.setFullName("Test User");

        session = new ChatSession();
        session.setSessionId(100L);
        session.setUserId(1L);
    }

    @Test
    void sendMessage_createsNewSession_andReturnsSuggestions() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(inv -> {
            ChatSession s = inv.getArgument(0);
            s.setSessionId(100L);
            return s;
        });
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setMessageId(200L);
            return m;
        });
        when(goalRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(100L)).thenReturn(List.of());

        ActionSuggestion suggestion = ActionSuggestion.newBuilder()
                .setSuggestionId("abc-123")
                .setType("create_goal")
                .setDisplayText("Create goal: \"Learn Spanish\"")
                .setParamsJson("{\"title\":\"Learn Spanish\"}")
                .build();

        AgentChatResponse aiResponse = AgentChatResponse.newBuilder()
                .setAssistantMessage("Here's a suggestion!")
                .addSuggestions(suggestion)
                .build();

        when(aiGrpcClientService.agentChat(any(), any(), any(), any(), any(), any()))
                .thenReturn(aiResponse);

        ChatRequest request = new ChatRequest();
        request.setMessage("I want to learn Spanish");

        ChatResponse response = chatService.sendMessage(request);

        assertThat(response.getSessionId()).isEqualTo(100L);
        assertThat(response.getContent()).isEqualTo("Here's a suggestion!");
        assertThat(response.getSuggestions()).isNotNull();
        assertThat(response.getSuggestions()).contains("abc-123");
        assertThat(response.getSuggestions()).contains("create_goal");
        assertThat(response.getSuggestions()).contains("pending");
    }

    @Test
    void sendMessage_existingSession_verifiesOwnership() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(chatSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setMessageId(200L);
            return m;
        });
        when(goalRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(100L)).thenReturn(List.of());

        AgentChatResponse aiResponse = AgentChatResponse.newBuilder()
                .setAssistantMessage("Response")
                .build();
        when(aiGrpcClientService.agentChat(any(), any(), any(), any(), any(), any()))
                .thenReturn(aiResponse);

        ChatRequest request = new ChatRequest();
        request.setSessionId(100L);
        request.setMessage("Hello");

        ChatResponse response = chatService.sendMessage(request);

        assertThat(response.getContent()).isEqualTo("Response");
        assertThat(response.getSessionId()).isEqualTo(100L);
    }

    @Test
    void sendMessage_wrongUser_throwsException() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        when(userService.getCurrentUser()).thenReturn(otherUser);
        when(chatSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        ChatRequest request = new ChatRequest();
        request.setSessionId(100L);
        request.setMessage("Hello");

        assertThatThrownBy(() -> chatService.sendMessage(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Session not found");
    }

    @Test
    void sendMessage_noSuggestions_suggestionsFieldIsNull() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(chatSessionRepository.save(any(ChatSession.class))).thenAnswer(inv -> {
            ChatSession s = inv.getArgument(0);
            s.setSessionId(100L);
            return s;
        });
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setMessageId(200L);
            return m;
        });
        when(goalRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(100L)).thenReturn(List.of());

        AgentChatResponse aiResponse = AgentChatResponse.newBuilder()
                .setAssistantMessage("Just a plain reply")
                .build();
        when(aiGrpcClientService.agentChat(any(), any(), any(), any(), any(), any()))
                .thenReturn(aiResponse);

        ChatRequest request = new ChatRequest();
        request.setMessage("How are you?");

        ChatResponse response = chatService.sendMessage(request);

        assertThat(response.getSuggestions()).isNull();
    }

    @Test
    void updateSuggestionStatus_updatesStatusInJson() throws Exception {
        String suggestionsJson = mapper.writeValueAsString(List.of(
                java.util.Map.of(
                        "suggestionId", "abc-123",
                        "type", "create_goal",
                        "displayText", "Create goal",
                        "paramsJson", "{}",
                        "status", "pending"
                ),
                java.util.Map.of(
                        "suggestionId", "def-456",
                        "type", "add_checklist_item",
                        "displayText", "Add item",
                        "paramsJson", "{}",
                        "status", "pending"
                )
        ));

        ChatMessage message = new ChatMessage();
        message.setMessageId(200L);
        message.setSessionId(100L);
        message.setSuggestions(suggestionsJson);

        when(userService.getCurrentUser()).thenReturn(user);
        when(chatMessageRepository.findById(200L)).thenReturn(Optional.of(message));
        when(chatSessionRepository.findById(100L)).thenReturn(Optional.of(session));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        chatService.updateSuggestionStatus(200L, "abc-123", "accepted");

        ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
        verify(chatMessageRepository).save(captor.capture());

        String updatedJson = captor.getValue().getSuggestions();
        List<java.util.Map<String, Object>> suggestions = mapper.readValue(
                updatedJson, new TypeReference<>() {});

        assertThat(suggestions).hasSize(2);
        assertThat(suggestions.get(0).get("status")).isEqualTo("accepted");
        assertThat(suggestions.get(1).get("status")).isEqualTo("pending");
    }

    @Test
    void updateSuggestionStatus_wrongUser_throwsException() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        ChatMessage message = new ChatMessage();
        message.setMessageId(200L);
        message.setSessionId(100L);
        message.setSuggestions("[{}]");

        when(userService.getCurrentUser()).thenReturn(otherUser);
        when(chatMessageRepository.findById(200L)).thenReturn(Optional.of(message));
        when(chatSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> chatService.updateSuggestionStatus(200L, "abc", "accepted"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Session not found");
    }

    @Test
    void updateSuggestionStatus_messageNotFound_throwsException() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(chatMessageRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.updateSuggestionStatus(999L, "abc", "accepted"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Message not found");
    }

    @Test
    void updateSuggestionStatus_nullSuggestions_noOp() {
        ChatMessage message = new ChatMessage();
        message.setMessageId(200L);
        message.setSessionId(100L);
        message.setSuggestions(null);

        when(userService.getCurrentUser()).thenReturn(user);
        when(chatMessageRepository.findById(200L)).thenReturn(Optional.of(message));
        when(chatSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        chatService.updateSuggestionStatus(200L, "abc", "accepted");

        verify(chatMessageRepository, never()).save(any());
    }

    @Test
    void deleteSession_verifiesOwnershipAndDeletes() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(chatSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        chatService.deleteSession(100L);

        verify(chatSessionRepository).delete(session);
    }

    @Test
    void deleteSession_wrongUser_throwsException() {
        User otherUser = new User();
        otherUser.setUserId(99L);

        when(userService.getCurrentUser()).thenReturn(otherUser);
        when(chatSessionRepository.findById(100L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> chatService.deleteSession(100L))
                .isInstanceOf(RuntimeException.class);

        verify(chatSessionRepository, never()).delete(any());
    }

    @Test
    void getSessions_returnsOnlyCurrentUserSessions() {
        when(userService.getCurrentUser()).thenReturn(user);

        ChatSession s1 = new ChatSession();
        s1.setSessionId(1L);
        s1.setUserId(1L);
        s1.setTitle("Session 1");

        when(chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(1L)).thenReturn(List.of(s1));

        List<ChatSessionResponse> sessions = chatService.getSessions();

        assertThat(sessions).hasSize(1);
    }
}
