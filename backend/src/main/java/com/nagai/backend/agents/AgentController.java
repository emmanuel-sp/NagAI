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
import org.springframework.web.bind.annotation.RequestParam;
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
            @Valid @RequestBody UpdateContextRequest request) {
        return ResponseEntity.ok(agentService.updateContext(contextId, request));
    }

    @DeleteMapping("/contexts/{contextId}")
    public ResponseEntity<Void> deleteContext(@PathVariable Long contextId) {
        agentService.deleteContext(contextId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unsubscribe")
    public ResponseEntity<String> unsubscribe(@RequestParam String token) {
        try {
            agentService.stopByToken(token);
        } catch (Exception e) {
            // Swallow — return same response to prevent token enumeration
        }
        return ResponseEntity.ok(UNSUBSCRIBE_HTML);
    }

    private static final String UNSUBSCRIBE_HTML = """
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>Agent Stopped</title>
            <style>body{font-family:'Segoe UI',sans-serif;background:#faf5f4;display:flex;
            align-items:center;justify-content:center;min-height:100vh;margin:0;}
            .card{background:#fff;padding:48px;border-radius:12px;text-align:center;
            box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:400px;}
            h1{color:#2a1f1e;font-size:24px;margin:0 0 12px;}
            p{color:#6b5550;font-size:15px;line-height:1.6;margin:0;}</style></head>
            <body><div class="card"><h1>Agent stopped</h1>
            <p>Your NagAI agent has been stopped and will no longer send messages. You can re-deploy it anytime from the app.</p>
            </div></body></html>""";
}
