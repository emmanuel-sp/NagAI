package com.nagai.backend.exceptions;

public class ChecklistLimitException extends ChecklistException {
    public ChecklistLimitException() {
        super("Maximum of 20 checklist items per goal");
    }
}
