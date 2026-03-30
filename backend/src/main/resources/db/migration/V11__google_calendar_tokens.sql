-- Google Calendar OAuth tokens (stored per user for daily plan integration)
ALTER TABLE users
    ADD COLUMN google_calendar_refresh_token TEXT,
    ADD COLUMN google_calendar_access_token  TEXT,
    ADD COLUMN google_calendar_token_expiry  TIMESTAMP;

-- Per-config toggle: allow users to disable calendar even when connected
ALTER TABLE daily_checklist_config
    ADD COLUMN calendar_enabled BOOLEAN NOT NULL DEFAULT TRUE;
