package com.nagai.backend.exceptions;

public class ChecklistNotFoundException extends ChecklistException {
    public ChecklistNotFoundException() {
        super("Checklist item not found");
    }
    public ChecklistNotFoundException(String message) {
        super(message);
    }
    public ChecklistNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
