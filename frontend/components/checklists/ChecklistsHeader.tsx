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

import { IoListOutline } from "react-icons/io5";
import styles from "@/styles/checklist.module.css";

interface ChecklistsHeaderProps {
  filter: "all" | "active" | "completed";
  onFilterChange: (filter: "all" | "active" | "completed") => void;
}

export default function ChecklistsHeader({
  filter,
  onFilterChange,
}: ChecklistsHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.headerContent}>
        <div className={styles.headerTitle}>
          <IoListOutline size={40} />
          <h1>Checklists</h1>
        </div>
        <p className={styles.headerSubtitle}>
          Track progress on your goals with detailed checklists
        </p>
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
    </header>
  );
}
