package com.nagai.backend.exceptions;

public class AgentContextLimitException extends AgentException {
    public AgentContextLimitException() {
        super("Maximum of 4 agent contexts allowed");
    }
}
