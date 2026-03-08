package com.nagai.backend.exceptions;

public class AgentContextNotFoundException extends AgentException {
    public AgentContextNotFoundException() { super("Agent context not found"); }
}
