package com.nagai.backend.exceptions;

public class DailyChecklistAlreadyExistsException extends DailyChecklistException {
    public DailyChecklistAlreadyExistsException() { super("A daily checklist already exists for today"); }
    public DailyChecklistAlreadyExistsException(String message) { super(message); }
}
