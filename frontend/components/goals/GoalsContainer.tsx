/**
 * GoalsContainer Component
 *
 * Main container component for the Goals page that handles all business logic and state management.
 *
 * Component Hierarchy:
 * - GoalsContainer (this component)
 *   ├── GoalsHeader
 *   ├── GoalsEmptyState (when no goals)
 *   ├── GoalsList (when goals exist)
 *   ├── AddGoalModal
 *   └── EditGoalModal
 *
 * Responsibilities:
 * - Fetch and manage goals data
 * - Handle goal CRUD operations
 * - Manage modal states (add/edit)
 * - Coordinate between child components
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Goal, GoalWithDetails } from "@/types/goal";
import GoalsHeader from "@/components/goals/GoalsHeader";
import GoalsEmptyState from "@/components/goals/GoalsEmptyState";
import GoalsList from "@/components/goals/GoalsList";
import AddGoalModal from "@/components/goals/AddGoalModal";
import EditGoalModal from "@/components/goals/EditGoalModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";
import styles from "@/styles/goals/goalsList.module.css";
import {
  fetchGoals,
  fetchGoalById,
  updateGoal,
  createGoal,
  deleteGoal,
} from "@/services/goalService";

export default function GoalsContainer() {
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithDetails | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadGoals();
    }
  }, [authLoading]);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const fetchedGoals = await fetchGoals();
      setGoals(fetchedGoals);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewGoal = async (id: string) => {
    try {
      const goal = await fetchGoalById(id);
      setSelectedGoal(goal);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch goal details:", error);
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedGoal(null);
  };

  const handleAddGoal = () => {
    setIsAddModalOpen(true);
  };

  const handleCreateGoal = async (goalData: {
    title: string;
    description: string;
    targetDate: string;
    specific: string;
    measurable: string;
    attainable: string;
    relevant: string;
    timely: string;
  }) => {
    await createGoal(goalData);
    await loadGoals();
    handleCloseAddModal();
    setShowToast(true);
  };

  const handleUpdateGoal = async (goal: GoalWithDetails) => {
    await updateGoal(goal.id, goal);
    await loadGoals();
    handleCloseEditModal();
  };

  const handleRemoveGoal = async (goalId: string) => {
    await deleteGoal(goalId);
    await loadGoals();
    handleCloseEditModal();
  };

  if (isLoading) {
    return (
      <div className={styles.goalsContainer}>
        <LoadingSpinner message="Loading goals..." />
      </div>
    );
  }

  return (
    <div className={styles.goalsContainer}>
      <GoalsHeader onAddGoal={handleAddGoal} />

      {goals.length === 0 ? (
        <GoalsEmptyState onAddGoal={handleAddGoal} />
      ) : (
        <GoalsList goals={goals} onViewGoal={handleViewGoal} />
      )}

      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAdd={handleCreateGoal}
      />

      <EditGoalModal
        goal={selectedGoal}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateGoal}
        onRemove={handleRemoveGoal}
      />

      {showToast && (
        <Toast
          message={
            <>
              Goal added! Head to{" "}
              <Link href="/checklists" className={styles.toastLink}>
                Checklists
              </Link>{" "}
              to track your goal
            </>
          }
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
