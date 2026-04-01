"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgentData } from "@/contexts/AgentDataContext";
import { Goal } from "@/types/goal";
import GoalsList from "@/components/goals/GoalsList";
import GoalFormModal from "@/components/goals/GoalFormModal";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { IoAdd } from "@/components/icons";
import styles from "./goalsList.module.css";
import {
  fetchGoals,
  createGoal,
} from "@/services/goalService";
import { Checklist } from "@/types/checklist";
import { fetchChecklists } from "@/services/checklistService";

export default function GoalsContainer() {
  const router = useRouter();
  const { refreshAgent } = useAgentData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [fetchedGoals, fetchedChecklists] = await Promise.all([
        fetchGoals(),
        fetchChecklists(),
      ]);
      setGoals(fetchedGoals);
      setChecklists(fetchedChecklists);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      setLoadError("Failed to load goals. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
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
    stepsTaken: string;
  }) => {
    const createdGoal = await createGoal(goalData);
    await refreshAgent();
    await loadGoals();
    handleCloseAddModal();
    router.push(`/goals/${createdGoal.goalId}`);
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
          description="Create your first goal here, or head to chat if you want help turning a vague idea into a concrete SMART goal."
          action={
            <div className={styles.emptyActions}>
              <button onClick={handleAddGoal} className={styles.addGoalButton}>
                <IoAdd size={20} />
                Add Your First Goal
              </button>
              <Link href="/chat" className={styles.secondaryGoalAction}>
                Get Help in Chat
              </Link>
            </div>
          }
        />
      ) : (
        <GoalsList
          goals={goals}
          checklists={checklists}
          onViewGoal={(goalId) => router.push(`/goals/${goalId}`)}
        />
      )}

      <GoalFormModal
        mode="create"
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleCreateGoal}
      />
    </div>
  );
}
