package com.nagai.backend.exceptions;

public class DailyChecklistRegenerationLimitException extends DailyChecklistException {
    public DailyChecklistRegenerationLimitException() {
        super("Today's daily plan has already been regenerated once");
    }
}
