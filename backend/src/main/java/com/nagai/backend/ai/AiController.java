package com.nagai.backend.ai;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiGrpcClientService aiGrpcClientService;

    public AiController(AiGrpcClientService aiGrpcClientService) {
        this.aiGrpcClientService = aiGrpcClientService;
    }

    @PostMapping("/smart-goal-suggestion")
    public ResponseEntity<SmartGoalSuggestionResponse> suggestSmartField(
            @Valid @RequestBody SmartGoalSuggestionRequest request) {
        String suggestion = aiGrpcClientService.suggestSmartField(
                request.field(), request.goalTitle(), request.goalDescription(),
                request.existingFields() != null ? request.existingFields() : java.util.Map.of());
        return ResponseEntity.ok(new SmartGoalSuggestionResponse(suggestion));
    }
}
