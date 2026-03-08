package com.nagai.backend.exceptions;

public class ChecklistException extends RuntimeException {
    public ChecklistException() {
        super();
    }
    public ChecklistException(String message) {
        super(message);
    }
    public ChecklistException(String message, Throwable cause) {
        super(message, cause);
    }
}
