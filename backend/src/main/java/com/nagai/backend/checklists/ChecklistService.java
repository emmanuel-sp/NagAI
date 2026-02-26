package com.nagai.backend.checklists;
import java.util.List;

import org.springframework.stereotype.Service;

// import com.nagai.backend.goals.Goal;
// import com.nagai.backend.goals.GoalService;

@Service
public class ChecklistService {
    private final ChecklistRepository checklistRepository;
    // private final GoalService goalService;

    public ChecklistService(ChecklistRepository checklistRepository) {
        this.checklistRepository = checklistRepository;
        // this.goalService = goalService;
    }

    public List<ChecklistResponse> fetchGoalChecklist(Long goalId) {
        List<ChecklistItem> checklists = checklistRepository.findChecklistItemByGoalId(goalId);
        return checklists.stream().map((cl) -> ChecklistResponse.fromEntity(cl)).toList();
    }
}
