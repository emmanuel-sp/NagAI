-- Persist agent staleness and last checklist activity so cadence survives restarts
ALTER TABLE agent_contexts ADD COLUMN stale_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE agent_contexts ADD COLUMN pause_reason VARCHAR(50);
ALTER TABLE agent_contexts ADD COLUMN last_checklist_activity_at TIMESTAMP;
