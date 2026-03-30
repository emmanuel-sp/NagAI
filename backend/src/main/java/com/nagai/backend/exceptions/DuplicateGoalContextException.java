package com.nagai.backend.exceptions;

public class DuplicateGoalContextException extends AgentException {
    public DuplicateGoalContextException() {
        super("Each goal can only have one agent context");
    }
}
