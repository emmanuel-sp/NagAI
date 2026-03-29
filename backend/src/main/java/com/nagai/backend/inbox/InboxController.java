package com.nagai.backend.inbox;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nagai.backend.agents.AgentContext;
import com.nagai.backend.agents.AgentContextRepository;
import com.nagai.backend.agents.SentAgentMessage;
import com.nagai.backend.agents.SentAgentMessageRepository;
import com.nagai.backend.digests.Digest;
import com.nagai.backend.digests.DigestRepository;
import com.nagai.backend.digests.SentDigest;
import com.nagai.backend.digests.SentDigestRepository;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@RestController
@RequestMapping("/inbox")
public class InboxController {

    private final SentAgentMessageRepository sentAgentMessageRepository;
    private final SentDigestRepository sentDigestRepository;
    private final AgentContextRepository agentContextRepository;
    private final DigestRepository digestRepository;
    private final UserService userService;

    public InboxController(SentAgentMessageRepository sentAgentMessageRepository,
                           SentDigestRepository sentDigestRepository,
                           AgentContextRepository agentContextRepository,
                           DigestRepository digestRepository,
                           UserService userService) {
        this.sentAgentMessageRepository = sentAgentMessageRepository;
        this.sentDigestRepository = sentDigestRepository;
        this.agentContextRepository = agentContextRepository;
        this.digestRepository = digestRepository;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<InboxPageResponse> getInbox(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        User user = userService.getCurrentUser();
        // Fetch enough to cover any distribution between the two sources
        int fetchCount = (page + 1) * size + 1;
        PageRequest pageable = PageRequest.of(0, fetchCount);

        List<SentAgentMessage> agentMsgs = sentAgentMessageRepository
                .findByUserIdOrderBySentAtDesc(user.getUserId(), pageable);
        List<SentDigest> digests = sentDigestRepository
                .findByUserIdOrderBySentAtDesc(user.getUserId(), pageable);

        List<InboxItem> all = new ArrayList<>();

        for (SentAgentMessage msg : agentMsgs) {
            String contextName = agentContextRepository.findById(msg.getContextId())
                    .map(AgentContext::getName).orElse("Agent");
            all.add(new InboxItem(
                    msg.getSentMessageId(),
                    "agent",
                    msg.getSubject(),
                    extractPreview(msg.getContent()),
                    contextName,
                    msg.getSentAt() != null ? msg.getSentAt().toString() : ""
            ));
        }

        for (SentDigest digest : digests) {
            String digestName = digestRepository.findById(digest.getDigestId())
                    .map(Digest::getName).orElse("Digest");
            all.add(new InboxItem(
                    digest.getSentDigestId(),
                    "digest",
                    digest.getSubject(),
                    extractPreview(digest.getContent()),
                    digestName,
                    digest.getSentAt() != null ? digest.getSentAt().toString() : ""
            ));
        }

        all.sort(Comparator.comparing(InboxItem::sentAt).reversed());

        boolean hasMore = all.size() > (long) (page + 1) * size;
        List<InboxItem> pageItems = all.stream()
                .skip((long) page * size)
                .limit(size)
                .toList();

        return ResponseEntity.ok(new InboxPageResponse(pageItems, hasMore, page, size));
    }

    @GetMapping("/digest/{sentDigestId}")
    public ResponseEntity<DigestMessageResponse> getDigestMessage(@PathVariable Long sentDigestId) {
        User user = userService.getCurrentUser();
        SentDigest digest = sentDigestRepository.findById(sentDigestId).orElse(null);
        if (digest == null || !digest.getUserId().equals(user.getUserId())) {
            return ResponseEntity.notFound().build();
        }
        String digestName = digestRepository.findById(digest.getDigestId())
                .map(Digest::getName).orElse("Digest");
        return ResponseEntity.ok(new DigestMessageResponse(
                digest.getSentDigestId(),
                digest.getSubject(),
                digest.getContent(),
                digestName,
                digest.getSentAt() != null ? digest.getSentAt().toString() : ""
        ));
    }

    /** Strip HTML tags and return first 200 chars. */
    private String extractPreview(String content) {
        if (content == null || content.isBlank()) return "";
        String stripped = content.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").strip();
        return stripped.length() > 200 ? stripped.substring(0, 197) + "..." : stripped;
    }

    public record InboxItem(Long id, String type, String subject, String preview,
                            String label, String sentAt) {}

    public record InboxPageResponse(List<InboxItem> items, boolean hasMore, int page, int size) {}

    public record DigestMessageResponse(Long sentDigestId, String subject, String content,
                                        String digestName, String sentAt) {}
}
