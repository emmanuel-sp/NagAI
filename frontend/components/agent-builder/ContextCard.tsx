/** ContextCard Component - Individual context display card. Parent: ContextList */
"use client";
import { AgentContext } from "@/types/agent";
import { IoPencil, IoTrash, IoFlag, IoTime } from "react-icons/io5";
import styles from "@/styles/agent/agent-builder.module.css";

interface ContextCardProps {
  context: AgentContext;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const messageTypeLabels = {
  nag: { label: "Nag", color: "#ff6b6b" },
  motivation: { label: "Motivation", color: "#ffa500" },
  guidance: { label: "Guidance", color: "#6d5dff" },
};

const frequencyLabels = {
  daily: "Daily",
  "twice-daily": "Twice Daily",
  weekly: "Weekly",
  "bi-weekly": "Bi-weekly",
};

export default function ContextCard({
  context,
  canEdit,
  onEdit,
  onDelete,
}: ContextCardProps) {
  const typeInfo = messageTypeLabels[context.messageType];

  return (
    <div className={styles.contextCard}>
      <div className={styles.contextHeader}>
        <div className={styles.contextTitleRow}>
          <h3 className={styles.contextName}>{context.name}</h3>
          {canEdit && (
            <div className={styles.contextActions}>
              <button onClick={onEdit} className={styles.iconButton} title="Edit context">
                <IoPencil size={18} />
              </button>
              <button onClick={onDelete} className={styles.iconButtonDanger} title="Delete context">
                <IoTrash size={18} />
              </button>
            </div>
          )}
        </div>

        <div
          className={styles.messageTypeBadge}
          style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
        >
          <span>{typeInfo.label}</span>
        </div>
      </div>

      <div className={styles.contextBody}>
        <div className={styles.contextDetail}>
          <IoFlag className={styles.detailIcon} />
          <span className={styles.detailLabel}>Goal:</span>
          <span className={styles.detailValue}>{context.goalName || "Unknown Goal"}</span>
        </div>

        <div className={styles.contextDetail}>
          <IoTime className={styles.detailIcon} />
          <span className={styles.detailLabel}>Frequency:</span>
          <span className={styles.detailValue}>{frequencyLabels[context.messageFrequency]}</span>
        </div>

        {context.customInstructions && (
          <div className={styles.customInstructions}>
            <span className={styles.detailLabel}>Custom Instructions:</span>
            <p className={styles.instructionsText}>{context.customInstructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
