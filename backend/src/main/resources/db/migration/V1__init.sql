CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone_number VARCHAR(64),
    user_location VARCHAR(64),
    career VARCHAR(64),
    bio TEXT,
    interests TEXT[],
    hobbies TEXT[],
    habits TEXT[],
    age INTEGER,
    life_context TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date VARCHAR(64),
    specific TEXT,
    measurable TEXT,
    attainable TEXT,
    relevant TEXT,
    timely TEXT,
    steps_taken TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE checklist_items (
    checklist_id SERIAL PRIMARY KEY,
    goal_id INTEGER,
    sort_order INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    deadline VARCHAR(30),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals (goal_id) ON DELETE CASCADE
);

CREATE TABLE digests (
    digest_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    frequency VARCHAR(30) NOT NULL,
    delivery_time VARCHAR(30) NOT NULL,
    content_types TEXT[],
    active BOOLEAN NOT NULL DEFAULT FALSE,
    unsubscribe_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_delivered_at TIMESTAMP,
    next_delivery_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE agents (
    agent_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    deployed BOOLEAN NOT NULL DEFAULT FALSE,
    communication_channel VARCHAR(30) NOT NULL DEFAULT 'email',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE agent_contexts (
    context_id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL,
    goal_id INTEGER,
    name VARCHAR(255) NOT NULL,
    message_type VARCHAR(30) NOT NULL,
    custom_instructions TEXT,
    last_message_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents (agent_id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals (goal_id) ON DELETE SET NULL
);

CREATE TABLE sent_digests (
    sent_digest_id SERIAL PRIMARY KEY,
    digest_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (digest_id) REFERENCES digests (digest_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE sent_agent_messages (
    sent_message_id SERIAL PRIMARY KEY,
    context_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    email_message_id VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (context_id) REFERENCES agent_contexts (context_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE agent_replies (
    reply_id SERIAL PRIMARY KEY,
    sent_message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sent_message_id) REFERENCES sent_agent_messages (sent_message_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Performance indexes for scheduled queries
CREATE INDEX idx_digests_active_next_delivery ON digests (active, next_delivery_at);
CREATE INDEX idx_agents_deployed ON agents (deployed);
CREATE INDEX idx_checklist_items_goal_id ON checklist_items (goal_id);
CREATE INDEX idx_goals_user_id ON goals (user_id);
CREATE INDEX idx_agent_contexts_agent_id ON agent_contexts (agent_id);
CREATE INDEX idx_sent_agent_messages_context_id ON sent_agent_messages (context_id);
