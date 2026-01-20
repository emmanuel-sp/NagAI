/**
 * GoalsEmptyState Component
 *
 * Displays empty state when user has no goals with call-to-action to add first goal.
 *
 * Parent: GoalsContainer
 * Children: EmptyState (common component)
 *
 * Props:
 * - onAddGoal: Callback function to open the add goal modal
 */

"use client";

import { IoFlagOutline, IoAdd } from "react-icons/io5";
import EmptyState from "@/components/common/EmptyState";
import styles from "@/styles/goals/goalsList.module.css";

interface GoalsEmptyStateProps {
  onAddGoal: () => void;
}

export default function GoalsEmptyState({ onAddGoal }: GoalsEmptyStateProps) {
  return (
    <EmptyState
      title="No goals yet"
      description="Create your first goal to get started on your journey"
      action={
        <button onClick={onAddGoal} className={styles.addGoalButton}>
          <IoAdd size={20} />
          Add Your First Goal
        </button>
      }
    />
  );
}
