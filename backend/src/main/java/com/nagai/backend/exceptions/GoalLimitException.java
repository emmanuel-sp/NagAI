package com.nagai.backend.exceptions;

public class GoalLimitException extends GoalException {
    public GoalLimitException() {
        super("Maximum of 10 goals allowed");
    }
}
