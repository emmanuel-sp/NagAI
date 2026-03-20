"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Goal, GoalWithDetails } from "@/types/goal";
import GoalsList from "@/components/goals/GoalsList";
import GoalFormModal from "@/components/goals/GoalFormModal";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";
import { IoAdd } from "@/components/icons";
import styles from "./goalsList.module.css";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadGoals();
    }
  }, [authLoading]);

  const loadGoals = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const fetchedGoals = await fetchGoals();
      setGoals(fetchedGoals);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      setLoadError("Failed to load goals. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewGoal = async (goalId: number) => {
    try {
      const goal = await fetchGoalById(goalId);
      setSelectedGoal(goal);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch goal details:", error);
      setLoadError("Failed to open goal. Please try again.");
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
    await updateGoal(goal.goalId, goal);
    await loadGoals();
    handleCloseEditModal();
  };

  const handleRemoveGoal = async (goalId: number) => {
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
      {loadError && <div className={styles.loadError}>{loadError}</div>}

      {goals.length > 0 && (
        <div className={styles.goalsHeader}>
          <button onClick={handleAddGoal} className={styles.addGoalButton} disabled={goals.length >= 10}>
            <IoAdd size={18} />
            {goals.length >= 10 ? "Goal Limit Reached (10)" : "Add Goal"}
          </button>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Create your first goal to get started on your journey"
          action={
            <button onClick={handleAddGoal} className={styles.addGoalButton}>
              <IoAdd size={20} />
              Add Your First Goal
            </button>
          }
        />
      ) : (
        <GoalsList goals={goals} onViewGoal={handleViewGoal} />
      )}

      <GoalFormModal
        mode="create"
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleCreateGoal}
      />

      {selectedGoal && (
        <GoalFormModal
          mode="edit"
          isOpen={isEditModalOpen}
          goal={selectedGoal}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateGoal}
          onRemove={handleRemoveGoal}
        />
      )}

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
