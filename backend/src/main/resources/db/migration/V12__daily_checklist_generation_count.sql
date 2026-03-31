ALTER TABLE daily_checklists
    ADD COLUMN generation_count INTEGER NOT NULL DEFAULT 1;
