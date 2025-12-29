/**
 * ChecklistsHeader Component
 *
 * Header section for the Checklists page displaying title, subtitle, and filter buttons.
 *
 * Parent: ChecklistsContainer
 * Children: None (presentational component)
 *
 * Props:
 * - filter: Current filter state ('all' | 'active' | 'completed')
 * - onFilterChange: Callback to change filter state
 */

"use client";

import styles from "@/styles/checklists/checklist.module.css";

interface ChecklistsHeaderProps {
  filter: "all" | "active" | "completed";
  onFilterChange: (filter: "all" | "active" | "completed") => void;
}

export default function ChecklistsHeader({
  filter,
  onFilterChange,
}: ChecklistsHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerContent}>
        <div>
          <h1 className={styles.headerTitle}>Checklists</h1>
        </div>
        <div className={styles.filterButtons}>
          <button
            onClick={() => onFilterChange("all")}
            className={`${styles.filterButton} ${
              filter === "all" ? styles.filterButtonActive : ""
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange("active")}
            className={`${styles.filterButton} ${
              filter === "active" ? styles.filterButtonActive : ""
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onFilterChange("completed")}
            className={`${styles.filterButton} ${
              filter === "completed" ? styles.filterButtonActive : ""
            }`}
          >
            Completed
          </button>
        </div>
      </div>
    </div>
  );
}
