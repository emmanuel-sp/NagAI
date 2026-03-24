-- Per-user daily checklist configuration
CREATE TABLE daily_checklist_config (
    config_id         SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL UNIQUE,
    max_items         INTEGER NOT NULL DEFAULT 10,
    recurring_items   TEXT,
    included_goal_ids TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- One daily checklist per user per date
CREATE TABLE daily_checklists (
    daily_checklist_id SERIAL PRIMARY KEY,
    user_id            INTEGER NOT NULL,
    plan_date          DATE NOT NULL,
    generated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, plan_date),
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Items within a daily checklist
CREATE TABLE daily_checklist_items (
    daily_item_id       SERIAL PRIMARY KEY,
    daily_checklist_id  INTEGER NOT NULL,
    parent_checklist_id INTEGER,
    sort_order          INTEGER NOT NULL,
    title               VARCHAR(255) NOT NULL,
    notes               TEXT,
    scheduled_time      VARCHAR(10),
    completed           BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at        VARCHAR(30),
    FOREIGN KEY (daily_checklist_id) REFERENCES daily_checklists (daily_checklist_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_checklist_id) REFERENCES checklist_items (checklist_id) ON DELETE SET NULL
);

CREATE INDEX idx_daily_checklists_user_date ON daily_checklists (user_id, plan_date);
CREATE INDEX idx_daily_items_checklist ON daily_checklist_items (daily_checklist_id);
CREATE INDEX idx_daily_items_parent ON daily_checklist_items (parent_checklist_id);
