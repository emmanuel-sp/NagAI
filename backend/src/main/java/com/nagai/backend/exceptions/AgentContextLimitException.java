package com.nagai.backend.exceptions;

public class AgentContextLimitException extends AgentException {
    public AgentContextLimitException() {
        super("Maximum of 3 agent contexts allowed");
    }
}
