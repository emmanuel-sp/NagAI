"use client";

import { useEffect } from "react";
import { GoalWithDetails } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import { IoClose, IoPencil } from "@/components/icons";
import { useModal } from "@/contexts/ModalContext";
import { parseUtcDate } from "@/lib/dates";
import styles from "./goalView.module.css";

interface GoalViewModalProps {
  isOpen: boolean;
  goal: GoalWithDetails;
  checklist?: Checklist;
  onClose: () => void;
  onEdit: () => void;
}

const SMART_LABELS: Record<string, string> = {
  specific: "Specific",
  measurable: "Measurable",
  attainable: "Attainable",
  relevant: "Relevant",
  timely: "Timely",
};

const formatDate = (dateStr: string) =>
  parseUtcDate(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default function GoalViewModal({
  isOpen,
  goal,
  checklist,
  onClose,
  onEdit,
}: GoalViewModalProps) {
  const { registerModal } = useModal();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      registerModal(true);
    }
    return () => {
      document.body.style.overflow = "";
      registerModal(false);
    };
  }, [isOpen, registerModal]);

  if (!isOpen) return null;

  const totalItems = checklist?.items.length ?? 0;
  const completedItems =
    checklist?.items.filter((i) => i.completed).length ?? 0;
  const progressPct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const nextItem = checklist?.items
    .filter((i) => !i.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];

  const smartFields = (
    ["specific", "measurable", "attainable", "relevant", "timely"] as const
  ).filter((f) => goal[f]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {goal.targetDate && (
              <span className={styles.targetBadge}>
                Target: {formatDate(goal.targetDate)}
              </span>
            )}
            <span className={styles.createdDate}>
              Created {formatDate(goal.createdAt)}
            </span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <IoClose size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <h2 className={styles.title}>{goal.title}</h2>

          {goal.description && (
            <p className={styles.description}>{goal.description}</p>
          )}

          {/* Progress */}
          {totalItems > 0 && (
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Progress</span>
                <span className={styles.progressCount}>
                  {completedItems} of {totalItems} completed
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {nextItem && (
                <span className={styles.nextItemText}>
                  Next: {nextItem.title}
                </span>
              )}
            </div>
          )}

          {/* Steps taken */}
          {goal.stepsTaken && (
            <div className={styles.section}>
              <h3 className={styles.sectionLabel}>Steps Already Taken</h3>
              <p className={styles.sectionText}>{goal.stepsTaken}</p>
            </div>
          )}

          {/* SMART fields */}
          {smartFields.length > 0 && (
            <div className={styles.smartSection}>
              <h3 className={styles.smartHeading}>SMART Framework</h3>
              <div className={styles.smartGrid}>
                {smartFields.map((field) => (
                  <div key={field} className={styles.smartCard}>
                    <span className={styles.smartCardLabel}>
                      {SMART_LABELS[field]}
                    </span>
                    <p className={styles.smartCardText}>{goal[field]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.editButton} onClick={onEdit}>
            <IoPencil size={16} />
            Edit Goal
          </button>
        </div>
      </div>
    </div>
  );
}
