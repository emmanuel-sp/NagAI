-- Track consecutive stale digest deliveries and auto-pause reason
ALTER TABLE digests ADD COLUMN stale_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE digests ADD COLUMN pause_reason VARCHAR(50);
