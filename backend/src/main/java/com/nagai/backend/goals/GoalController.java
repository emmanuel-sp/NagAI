package com.nagai.backend.goals;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/goals")
public class GoalController {
    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getAllGoals() {
        List<GoalResponse> responses = goalService.getAllGoals()
            .stream()
            .map(GoalResponse::fromEntity)
            .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<GoalResponse> getGoal(@PathVariable Long goalId) {
        return ResponseEntity.ok(GoalResponse.fromEntity(goalService.getGoalForCurrentUser(goalId)));
    }

    @PostMapping
    public ResponseEntity<GoalResponse> addGoal(@Valid @RequestBody GoalAddRequest goalAddRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(GoalResponse.fromEntity(goalService.addGoal(goalAddRequest)));
    }

    @PutMapping
    public ResponseEntity<GoalResponse> updateGoal(@Valid @RequestBody GoalUpdateRequest goalUpdateRequest) {
        return ResponseEntity.ok(GoalResponse.fromEntity(goalService.updateGoal(goalUpdateRequest)));
    }

    @PatchMapping("/{goalId}/journal")
    public ResponseEntity<GoalResponse> updateGoalJournal(
            @PathVariable Long goalId,
            @Valid @RequestBody GoalJournalUpdateRequest request) {
        return ResponseEntity.ok(GoalResponse.fromEntity(goalService.updateGoalJournal(goalId, request)));
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long goalId) {
        goalService.deleteGoal(goalId);
        return ResponseEntity.noContent().build();
    }
}
