package com.nagai.backend.checklists;

import java.util.List;

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
@RequestMapping("/checklists")
@Validated
public class ChecklistController {
    private final ChecklistService checklistService;

    public ChecklistController(ChecklistService checklistService) {
        this.checklistService = checklistService;
    }

    @GetMapping("/goal/{goalId}")
    public ResponseEntity<List<ChecklistResponse>> getGoalChecklist(@PathVariable Long goalId) {
        return ResponseEntity.ok(checklistService.fetchGoalChecklist(goalId));
    }

    @PatchMapping("/goal/{goalId}/reorder")
    public ResponseEntity<List<ChecklistResponse>> reorderGoalChecklist(
            @PathVariable Long goalId,
            @Valid @RequestBody ChecklistReorderRequest request) {
        return ResponseEntity.ok(checklistService.reorderItems(goalId, request));
    }

    @PostMapping
    public ResponseEntity<ChecklistResponse> addChecklistItem(@Valid @RequestBody ChecklistAddRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(checklistService.addChecklistItem(request));
    }

    @PutMapping
    public ResponseEntity<ChecklistResponse> updateChecklistItem(@Valid @RequestBody ChecklistUpdateRequest request) {
        return ResponseEntity.ok(checklistService.updateChecklistItem(request));
    }

    @PatchMapping("/{checklistId}/toggle")
    public ResponseEntity<ChecklistResponse> toggleComplete(@PathVariable Long checklistId) {
        return ResponseEntity.ok(checklistService.toggleComplete(checklistId));
    }

    @DeleteMapping("/{checklistId}")
    public ResponseEntity<Void> deleteChecklistItem(@PathVariable Long checklistId) {
        checklistService.deleteChecklistItem(checklistId);
        return ResponseEntity.noContent().build();
    }
}
