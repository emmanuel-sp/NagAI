ALTER TABLE daily_checklist_items
    ADD COLUMN parent_goal_id BIGINT REFERENCES goals(goal_id) ON DELETE SET NULL;
