package com.nagai.backend.dailychecklist;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DailyChecklistItemUpdateRequest {

    @Size(max = 200, message = "title must be 200 characters or fewer")
    private String title;

    @Size(max = 500, message = "notes must be 500 characters or fewer")
    private String notes;

    @Size(max = 10, message = "scheduledTime must be 10 characters or fewer")
    private String scheduledTime;

    @JsonIgnore
    private boolean notesProvided;

    @JsonIgnore
    private boolean scheduledTimeProvided;

    @JsonSetter(value = "notes", nulls = Nulls.SET)
    public void setNotes(String notes) {
        this.notes = notes;
        this.notesProvided = true;
    }

    @JsonSetter(value = "scheduledTime", nulls = Nulls.SET)
    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
        this.scheduledTimeProvided = true;
    }
}
