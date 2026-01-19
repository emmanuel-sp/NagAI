package com.nagai.backend.goals;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        Goal goal = goalService.getGoal(goalId);
        return ResponseEntity.ok(GoalResponse.fromEntity(goal));
    }

    @PostMapping
    public ResponseEntity<Goal> addGoal(@RequestBody GoalAddRequest goalAddRequest) {
        Goal goal = goalService.addGoal(goalAddRequest);
        return ResponseEntity.ok(goal);
    }
    @PutMapping
    public ResponseEntity<Goal> updateGoal(@RequestBody GoalUpdateRequest goalUpdateRequest) {
        Goal goal = goalService.updateGoal(goalUpdateRequest);
        return ResponseEntity.ok(goal);
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Boolean> deleteGoal(@PathVariable Long goalId) {
        goalService.deleteGoal(goalId);
        return ResponseEntity.status(HttpStatus.OK).body(true);
    }

}
