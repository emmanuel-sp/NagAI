package com.nagai.backend.inbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.nagai.backend.agents.AgentContextRepository;
import com.nagai.backend.agents.SentAgentMessageRepository;
import com.nagai.backend.digests.DigestRepository;
import com.nagai.backend.digests.SentDigestRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
class InboxControllerTest {

    @Mock private SentAgentMessageRepository sentAgentMessageRepository;
    @Mock private SentDigestRepository sentDigestRepository;
    @Mock private AgentContextRepository agentContextRepository;
    @Mock private DigestRepository digestRepository;
    @Mock private UserService userService;

    private InboxController inboxController;
    private User user;

    @BeforeEach
    void setUp() {
        inboxController = new InboxController(
                sentAgentMessageRepository,
                sentDigestRepository,
                agentContextRepository,
                digestRepository,
                userService
        );

        user = new User();
        user.setUserId(1L);
    }

    @Test
    void getInbox_rejectsNegativePages() {
        ResponseEntity<InboxController.InboxPageResponse> response = inboxController.getInbox(-1, 5);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(userService);
    }

    @Test
    void getInbox_clampsPageSizeToConfiguredMaximum() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(sentAgentMessageRepository.findByUserIdOrderBySentAtDesc(any(), any(Pageable.class))).thenReturn(List.of());
        when(sentDigestRepository.findByUserIdOrderBySentAtDesc(any(), any(Pageable.class))).thenReturn(List.of());

        ResponseEntity<InboxController.InboxPageResponse> response = inboxController.getInbox(0, 500);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().size()).isEqualTo(50);
        assertThat(response.getBody().page()).isEqualTo(0);
        assertThat(response.getBody().items()).isEmpty();
    }
}
