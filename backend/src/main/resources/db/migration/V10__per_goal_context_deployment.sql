ALTER TABLE agent_contexts
    ADD COLUMN deployed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE agent_contexts ac
SET deployed = COALESCE(a.deployed, FALSE)
FROM agents a
WHERE ac.agent_id = a.agent_id;

WITH ranked AS (
    SELECT context_id,
           ROW_NUMBER() OVER (
               PARTITION BY agent_id, goal_id
               ORDER BY created_at DESC, context_id DESC
           ) AS row_num
    FROM agent_contexts
)
DELETE FROM agent_contexts
WHERE context_id IN (
    SELECT context_id
    FROM ranked
    WHERE row_num > 1
);

ALTER TABLE agent_contexts
    ADD CONSTRAINT uq_agent_contexts_agent_goal UNIQUE (agent_id, goal_id);
