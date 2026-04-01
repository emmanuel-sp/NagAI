ALTER TABLE users
    ADD COLUMN verification_token_hash VARCHAR(64);

ALTER TABLE digests
    ADD COLUMN unsubscribe_token_hash VARCHAR(64),
    ADD COLUMN processing_started_at TIMESTAMP;

ALTER TABLE agents
    ADD COLUMN unsubscribe_token_hash VARCHAR(64);

ALTER TABLE agent_contexts
    ADD COLUMN processing_started_at TIMESTAMP;

CREATE UNIQUE INDEX idx_users_verification_token_hash
    ON users (verification_token_hash)
    WHERE verification_token_hash IS NOT NULL;

CREATE UNIQUE INDEX idx_digests_unsubscribe_token_hash
    ON digests (unsubscribe_token_hash)
    WHERE unsubscribe_token_hash IS NOT NULL;

CREATE UNIQUE INDEX idx_agents_unsubscribe_token_hash
    ON agents (unsubscribe_token_hash)
    WHERE unsubscribe_token_hash IS NOT NULL;

CREATE INDEX idx_agent_contexts_deployed_next_message_at
    ON agent_contexts (deployed, next_message_at);

CREATE INDEX idx_sent_digests_user_sent_at_desc
    ON sent_digests (user_id, sent_at DESC);

CREATE INDEX idx_sent_agent_messages_user_sent_at_desc
    ON sent_agent_messages (user_id, sent_at DESC);

CREATE INDEX idx_chat_sessions_user_updated_at_desc
    ON chat_sessions (user_id, updated_at DESC);
