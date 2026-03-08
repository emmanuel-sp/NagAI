/** EmptyContextState Component - Shows when no contexts exist. Parent: AgentBuilderContainer */
"use client";
import styles from "./agent-builder.module.css";

interface EmptyContextStateProps {
  canCreate: boolean;
  onCreate: () => void;
}

export default function EmptyContextState({ canCreate, onCreate }: EmptyContextStateProps) {
  return (
    <div className={styles.emptyState}>
      <h3 className={styles.emptyStateTitle}>No Contexts Yet</h3>
      <p className={styles.emptyStateText}>
        Create your first context to define how your agent will interact with you about your goals.
      </p>
      {canCreate && (
        <button onClick={onCreate} className={styles.deployButton}>
          Create Your First Context
        </button>
      )}
      {!canCreate && (
        <p className={styles.warningText}>
          Agent is deployed. Redeploy to add or edit contexts.
        </p>
      )}
    </div>
  );
}
