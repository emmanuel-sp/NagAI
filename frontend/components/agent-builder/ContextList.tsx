/** ContextList Component - Displays list of contexts with add button. Parent: AgentBuilderContainer */
"use client";
import { AgentContext } from "@/types/agent";
import ContextCard from "./ContextCard";
import { IoAdd } from "@/components/icons";
import styles from "./agent-builder.module.css";

interface ContextListProps {
  contexts: AgentContext[];
  canEdit: boolean;
  canCreate: boolean;
  onEdit: (context: AgentContext) => void;
  onDelete: (contextId: number) => void;
  onCreate: () => void;
}

export default function ContextList({
  contexts,
  canEdit,
  canCreate,
  onEdit,
  onDelete,
  onCreate,
}: ContextListProps) {
  return (
    <div className={styles.contextsSection}>
      <div className={styles.contextsSectionHeader}>
        <h2 className={styles.cardTitle}>Agent Contexts ({contexts.length}/4)</h2>
        {canEdit && canCreate && (
          <button onClick={onCreate} className={styles.addContextButton}>
            <IoAdd size={20} />
            Add Context
          </button>
        )}
      </div>

      {!canEdit && (
        <div className={styles.infoMessage}>
          Agent is deployed. Redeploy to add or edit contexts.
        </div>
      )}

      <div className={styles.contextsList}>
        {contexts.map((context) => (
          <ContextCard
            key={context.contextId}
            context={context}
            canEdit={canEdit}
            onEdit={() => onEdit(context)}
            onDelete={() => onDelete(context.contextId)}
          />
        ))}
      </div>
    </div>
  );
}
