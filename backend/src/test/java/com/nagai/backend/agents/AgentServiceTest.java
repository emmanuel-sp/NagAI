package com.nagai.backend.agents;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.nagai.backend.exceptions.AgentContextNotFoundException;
import com.nagai.backend.goals.GoalRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
class AgentServiceTest {

    @Mock
    private AgentRepository agentRepository;

    @Mock
    private AgentContextRepository agentContextRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private AgentService agentService;

    private User user;
    private Agent agent;
    private AgentContext context;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");

        agent = new Agent();
        agent.setAgentId(10L);
        agent.setUserId(1L);
        agent.setName("My AI Agent");
        agent.setDeployed(false);
        agent.setCommunicationChannel("email");

        context = new AgentContext();
        context.setContextId(100L);
        context.setAgentId(10L);
        context.setName("Morning Check");
        context.setMessageType("motivation");
        context.setMessageFrequency("daily");
    }

    @Test
    void getOrCreateAgent_returnsExistingAgent() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentContextRepository.findByAgentId(10L)).thenReturn(List.of(context));

        AgentResponse result = agentService.getOrCreateAgent();

        assertThat(result.getAgentId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("My AI Agent");
        assertThat(result.getContexts()).hasSize(1);
        verify(agentRepository, never()).save(any());
    }

    @Test
    void getOrCreateAgent_createsDefaultAgentWhenNoneExists() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(agentRepository.save(any(Agent.class))).thenAnswer(inv -> {
            Agent a = inv.getArgument(0);
            a.setAgentId(10L);
            return a;
        });
        when(agentContextRepository.findByAgentId(10L)).thenReturn(List.of());

        AgentResponse result = agentService.getOrCreateAgent();

        assertThat(result.getName()).isEqualTo("My AI Agent");
        assertThat(result.getCommunicationChannel()).isEqualTo("email");
        assertThat(result.isDeployed()).isFalse();
        verify(agentRepository).save(any(Agent.class));
    }

    @Test
    void updateCommunicationChannel_updatesChannel() {
        CommunicationChannelRequest request = new CommunicationChannelRequest();
        request.setChannel("phone");

        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentRepository.save(any(Agent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agentContextRepository.findByAgentId(10L)).thenReturn(List.of());

        AgentResponse result = agentService.updateCommunicationChannel(request);

        assertThat(result.getCommunicationChannel()).isEqualTo("phone");
        verify(agentRepository).save(agent);
    }

    @Test
    void deployAgent_setsDeployedTrue() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentRepository.save(any(Agent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agentContextRepository.findByAgentId(10L)).thenReturn(List.of());

        AgentResponse result = agentService.deployAgent();

        assertThat(result.isDeployed()).isTrue();
    }

    @Test
    void stopAgent_setsDeployedFalse() {
        agent.setDeployed(true);

        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentRepository.save(any(Agent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agentContextRepository.findByAgentId(10L)).thenReturn(List.of());

        AgentResponse result = agentService.stopAgent();

        assertThat(result.isDeployed()).isFalse();
    }

    @Test
    void addContext_savesAndReturnsContext() {
        AddContextRequest request = new AddContextRequest();
        request.setName("Evening Review");
        request.setMessageType("guidance");
        request.setMessageFrequency("weekly");
        request.setCustomInstructions("Be concise.");

        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentContextRepository.save(any(AgentContext.class))).thenAnswer(inv -> {
            AgentContext c = inv.getArgument(0);
            c.setContextId(200L);
            return c;
        });

        AgentContextResponse result = agentService.addContext(request);

        assertThat(result.getName()).isEqualTo("Evening Review");
        assertThat(result.getAgentId()).isEqualTo(10L);
        assertThat(result.getMessageType()).isEqualTo("guidance");
        verify(agentContextRepository).save(any(AgentContext.class));
    }

    @Test
    void updateContext_updatesFields() {
        UpdateContextRequest request = new UpdateContextRequest();
        request.setName("Updated Name");
        request.setMessageFrequency("weekly");

        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentContextRepository.findById(100L)).thenReturn(Optional.of(context));
        when(agentContextRepository.save(any(AgentContext.class))).thenAnswer(inv -> inv.getArgument(0));

        AgentContextResponse result = agentService.updateContext(100L, request);

        assertThat(result.getName()).isEqualTo("Updated Name");
        assertThat(result.getMessageFrequency()).isEqualTo("weekly");
    }

    @Test
    void updateContext_throwsNotFoundWhenContextDoesNotExist() {
        UpdateContextRequest request = new UpdateContextRequest();
        request.setName("X");

        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentContextRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> agentService.updateContext(999L, request))
                .isInstanceOf(AgentContextNotFoundException.class);
    }

    @Test
    void updateContext_throwsNotFoundWhenContextBelongsToDifferentAgent() {
        AgentContext otherContext = new AgentContext();
        otherContext.setContextId(100L);
        otherContext.setAgentId(99L); // different agent

        UpdateContextRequest request = new UpdateContextRequest();
        request.setName("X");

        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentContextRepository.findById(100L)).thenReturn(Optional.of(otherContext));

        assertThatThrownBy(() -> agentService.updateContext(100L, request))
                .isInstanceOf(AgentContextNotFoundException.class);
    }

    @Test
    void deleteContext_deletesSuccessfully() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentContextRepository.findById(100L)).thenReturn(Optional.of(context));

        agentService.deleteContext(100L);

        verify(agentContextRepository).delete(context);
    }

    @Test
    void deleteContext_throwsNotFoundWhenContextDoesNotExist() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(agentRepository.findByUserId(1L)).thenReturn(Optional.of(agent));
        when(agentContextRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> agentService.deleteContext(999L))
                .isInstanceOf(AgentContextNotFoundException.class);

        verify(agentContextRepository, never()).delete(any());
    }
}
