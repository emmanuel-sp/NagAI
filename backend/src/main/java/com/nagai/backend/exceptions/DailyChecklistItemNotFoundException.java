package com.nagai.backend.exceptions;

public class DailyChecklistItemNotFoundException extends DailyChecklistException {
    public DailyChecklistItemNotFoundException() { super("Daily checklist item not found"); }
    public DailyChecklistItemNotFoundException(String message) { super(message); }
}
