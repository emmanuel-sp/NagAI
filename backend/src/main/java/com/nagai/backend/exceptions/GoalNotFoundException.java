package com.nagai.backend.exceptions;

public class GoalNotFoundException extends GoalException {
    public GoalNotFoundException() {
        super();
    }
    public GoalNotFoundException(String message) {
        super(message);
    }
    public GoalNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
