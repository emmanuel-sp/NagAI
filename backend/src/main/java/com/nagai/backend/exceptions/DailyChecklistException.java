package com.nagai.backend.exceptions;

public class DailyChecklistException extends RuntimeException {
    public DailyChecklistException() { super(); }
    public DailyChecklistException(String message) { super(message); }
    public DailyChecklistException(String message, Throwable cause) { super(message, cause); }
}
