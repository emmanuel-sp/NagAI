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
import { GoalDetails } from "@/components/goals/Goal";
import GoalsHeader from "@/components/goals/GoalsHeader";
import GoalsEmptyState from "@/components/goals/GoalsEmptyState";
import GoalsList from "@/components/goals/GoalsList";
import AddGoalModal from "@/components/goals/AddGoalModal";
import EditGoalModal from "@/components/goals/EditGoalModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import styles from "@/styles/goals/goalsList.module.css";
import {
  GoalDetailsFull,
  fetchGoals,
  fetchGoalById,
  updateGoal,
  createGoal,
} from "@/services/goalService";

export default function GoalsContainer() {
  const [goals, setGoals] = useState<GoalDetails[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalDetailsFull | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

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
  };

  const handleUpdateGoal = async (goal: GoalDetailsFull) => {
    await updateGoal(goal.id, goal);
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
      />
    </div>
  );
}
