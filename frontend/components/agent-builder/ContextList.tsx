/** ContextList Component - Displays list of contexts with add button. Parent: AgentBuilderContainer */
"use client";
import { AgentContext } from "@/types/agent";
import ContextCard from "./ContextCard";
import { IoAdd } from "react-icons/io5";
import styles from "@/styles/agent/agent-builder.module.css";

interface ContextListProps {
  contexts: AgentContext[];
  canEdit: boolean;
  onEdit: (context: AgentContext) => void;
  onDelete: (contextId: string) => void;
  onCreate: () => void;
}

export default function ContextList({
  contexts,
  canEdit,
  onEdit,
  onDelete,
  onCreate,
}: ContextListProps) {
  return (
    <div className={styles.contextsSection}>
      <div className={styles.contextsSectionHeader}>
        <h2 className={styles.cardTitle}>Agent Contexts</h2>
        {canEdit && (
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
            key={context.id}
            context={context}
            canEdit={canEdit}
            onEdit={() => onEdit(context)}
            onDelete={() => onDelete(context.id)}
          />
        ))}
      </div>
    </div>
  );
}
