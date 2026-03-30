ALTER TABLE goals
    ADD COLUMN journal_markdown TEXT;

DELETE FROM agent_contexts ac
USING agents a
WHERE ac.agent_id = a.agent_id
  AND (
      ac.goal_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM goals g WHERE g.goal_id = ac.goal_id AND g.user_id = a.user_id)
  );

ALTER TABLE agent_contexts
    DROP CONSTRAINT agent_contexts_goal_id_fkey;

ALTER TABLE agent_contexts
    ALTER COLUMN goal_id SET NOT NULL;

ALTER TABLE agent_contexts
    ADD CONSTRAINT agent_contexts_goal_id_fkey
        FOREIGN KEY (goal_id) REFERENCES goals (goal_id) ON DELETE CASCADE;
