/**
 * GoalsHeader Component
 *
 * Header section for the Goals page displaying title, subtitle, and add button.
 *
 * Parent: GoalsContainer
 * Children: None (presentational component)
 *
 * Props:
 * - onAddGoal: Callback function to open the add goal modal
 */

"use client";

import { IoAdd } from "react-icons/io5";
import styles from "@/styles/goals/goalsList.module.css";

interface GoalsHeaderProps {
  onAddGoal: () => void;
}

export default function GoalsHeader({ onAddGoal }: GoalsHeaderProps) {
  return (
    <div className={styles.goalsHeader}>
      <div className={styles.goalsHeaderContent}>
        <div>
          <h1 className={styles.goalsTitle}>Goals</h1>
          <p className={styles.goalsSubtitle}>
            Track and manage your personal and professional goals
          </p>
        </div>
        <button onClick={onAddGoal} className={styles.addGoalButton}>
          <IoAdd size={20} />
          Add Goal
        </button>
      </div>
    </div>
  );
}
