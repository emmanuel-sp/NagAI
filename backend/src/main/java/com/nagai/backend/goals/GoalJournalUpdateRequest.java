package com.nagai.backend.goals;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoalJournalUpdateRequest {
    @Size(max = 20000, message = "journalMarkdown must be 20000 characters or fewer")
    private String journalMarkdown;
}
