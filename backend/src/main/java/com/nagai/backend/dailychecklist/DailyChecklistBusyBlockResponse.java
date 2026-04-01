package com.nagai.backend.dailychecklist;

import com.nagai.backend.calendar.GoogleCalendarService;

public record DailyChecklistBusyBlockResponse(
        String startTime,
        String endTime,
        String summary) {

    public static DailyChecklistBusyBlockResponse fromBusyBlock(GoogleCalendarService.BusyBlock busyBlock) {
        return new DailyChecklistBusyBlockResponse(
                busyBlock.startTime(),
                busyBlock.endTime(),
                busyBlock.summary());
    }
}
