-- Add unsubscribe token to agents for email stop links
ALTER TABLE agents ADD COLUMN unsubscribe_token VARCHAR(64) UNIQUE;

-- Backfill existing agents with tokens
UPDATE agents SET unsubscribe_token = gen_random_uuid()::text WHERE unsubscribe_token IS NULL;

ALTER TABLE agents ALTER COLUMN unsubscribe_token SET NOT NULL;
