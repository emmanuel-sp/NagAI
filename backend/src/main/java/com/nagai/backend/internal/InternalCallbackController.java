package com.nagai.backend.internal;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nagai.backend.agents.SentAgentMessage;
import com.nagai.backend.agents.SentAgentMessageRepository;
import com.nagai.backend.digests.SentDigest;
import com.nagai.backend.digests.SentDigestRepository;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/internal")
public class InternalCallbackController {

    private static final Logger log = LoggerFactory.getLogger(InternalCallbackController.class);

    private final SentDigestRepository sentDigestRepository;
    private final SentAgentMessageRepository sentAgentMessageRepository;

    public InternalCallbackController(SentDigestRepository sentDigestRepository,
                                       SentAgentMessageRepository sentAgentMessageRepository) {
        this.sentDigestRepository = sentDigestRepository;
        this.sentAgentMessageRepository = sentAgentMessageRepository;
    }

    @PostMapping("/sent-digests")
    public ResponseEntity<Void> saveSentDigest(@Valid @RequestBody SentDigestRequest request) {
        SentDigest entity = new SentDigest();
        entity.setDigestId(request.digestId());
        entity.setUserId(request.userId());
        entity.setSubject(request.subject());
        entity.setContent(request.content());
        sentDigestRepository.save(entity);
        log.info("Saved sent digest for digest={} user={}", request.digestId(), request.userId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sent-agent-messages")
    public ResponseEntity<Map<String, Long>> saveSentAgentMessage(@Valid @RequestBody SentAgentMessageRequest request) {
        SentAgentMessage entity = new SentAgentMessage();
        entity.setContextId(request.contextId());
        entity.setUserId(request.userId());
        entity.setSubject(request.subject());
        entity.setContent(request.content());
        entity.setEmailMessageId(request.emailMessageId());
        entity = sentAgentMessageRepository.save(entity);
        log.info("Saved sent agent message id={} for context={} user={}", entity.getSentMessageId(), request.contextId(), request.userId());
        return ResponseEntity.ok(Map.of("sentMessageId", entity.getSentMessageId()));
    }

    record SentDigestRequest(
        @NotNull Long digestId,
        @NotNull Long userId,
        @NotBlank String subject,
        @NotBlank String content
    ) {}

    record SentAgentMessageRequest(
        @NotNull Long contextId,
        @NotNull Long userId,
        @NotBlank String subject,
        @NotBlank String content,
        String emailMessageId
    ) {}
}
