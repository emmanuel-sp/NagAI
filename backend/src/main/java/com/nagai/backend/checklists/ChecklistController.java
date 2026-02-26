package com.nagai.backend.checklists;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/checklists")
public class ChecklistController {
    private final ChecklistService checklistService;

    public ChecklistController(ChecklistService checklistService) {
        this.checklistService = checklistService;
    }

    @GetMapping
    public ResponseEntity<List<ChecklistResponse>> getGoalChecklist(@RequestBody List<Long> goalIds) {
        List<ChecklistResponse> checklistResponses = new ArrayList<>();
        for (Long goalId : goalIds) {
            List<ChecklistResponse> response = checklistService.fetchGoalChecklist(goalId);
            checklistResponses.addAll(response);
        }
        return ResponseEntity.ok(checklistResponses);
    }
    
}
