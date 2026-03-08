package com.nagai.backend.exceptions;

public class AgentException extends RuntimeException {
    public AgentException() { super(); }
    public AgentException(String message) { super(message); }
    public AgentException(String message, Throwable cause) { super(message, cause); }
}
