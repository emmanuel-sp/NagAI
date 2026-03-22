-- Pre-computed next message time for timer-based scheduling (replaces per-minute polling)
ALTER TABLE agent_contexts ADD COLUMN next_message_at TIMESTAMP;

-- Backfill existing contexts based on last_message_sent_at + base interval per type
UPDATE agent_contexts SET next_message_at = last_message_sent_at + INTERVAL '6 hours'
    WHERE message_type = 'nag' AND last_message_sent_at IS NOT NULL;
UPDATE agent_contexts SET next_message_at = last_message_sent_at + INTERVAL '24 hours'
    WHERE message_type = 'motivation' AND last_message_sent_at IS NOT NULL;
UPDATE agent_contexts SET next_message_at = last_message_sent_at + INTERVAL '48 hours'
    WHERE message_type = 'guidance' AND last_message_sent_at IS NOT NULL;
