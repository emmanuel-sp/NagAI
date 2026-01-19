package com.nagai.backend.exceptions;

public class GoalException extends RuntimeException {
    public GoalException() {
        super();
    }
    public GoalException(String message) {
        super(message);
    }
    public GoalException(String message, Throwable cause) {
        super(message, cause);
    }
}
