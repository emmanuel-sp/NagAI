/**
 * ChecklistHeader Component
 *
 * Header for individual checklist showing goal title and progress bar.
 *
 * Parent: Checklist
 * Children: None (presentational component)
 *
 * Props:
 * - goalTitle: Title of the goal this checklist belongs to
 * - completedCount: Number of completed items
 * - totalCount: Total number of items
 */

"use client";

import styles from "@/styles/checklists/checklist.module.css";

interface ChecklistHeaderProps {
  goalTitle: string;
  completedCount: number;
  totalCount: number;
}

export default function ChecklistHeader({
  goalTitle,
  completedCount,
  totalCount,
}: ChecklistHeaderProps) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={styles.checklistHeader}>
      <div className={styles.checklistHeaderInfo}>
        <h2 className={styles.checklistGoalTitle}>{goalTitle}</h2>
        <div className={styles.checklistProgress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {completedCount} of {totalCount} completed
          </span>
        </div>
      </div>
    </div>
  );
}
