package com.nagai.backend.agents;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/agent")
@Validated
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @GetMapping
    public ResponseEntity<AgentResponse> getAgent() {
        return ResponseEntity.ok(agentService.getOrCreateAgent());
    }

    @PutMapping("/communication")
    public ResponseEntity<AgentResponse> updateCommunication(@Valid @RequestBody CommunicationChannelRequest request) {
        return ResponseEntity.ok(agentService.updateCommunicationChannel(request));
    }

    @PostMapping("/deploy")
    public ResponseEntity<AgentResponse> deploy() {
        return ResponseEntity.ok(agentService.deployAgent());
    }

    @PostMapping("/stop")
    public ResponseEntity<AgentResponse> stop() {
        return ResponseEntity.ok(agentService.stopAgent());
    }

    @PostMapping("/contexts")
    public ResponseEntity<AgentContextResponse> addContext(@Valid @RequestBody AddContextRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.addContext(request));
    }

    @PatchMapping("/contexts/{contextId}")
    public ResponseEntity<AgentContextResponse> updateContext(
            @PathVariable Long contextId,
            @RequestBody UpdateContextRequest request) {
        return ResponseEntity.ok(agentService.updateContext(contextId, request));
    }

    @DeleteMapping("/contexts/{contextId}")
    public ResponseEntity<Void> deleteContext(@PathVariable Long contextId) {
        agentService.deleteContext(contextId);
        return ResponseEntity.noContent().build();
    }
}
