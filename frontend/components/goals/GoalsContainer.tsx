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

  const totalChecklistItems = checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);
  const completedChecklistItems = checklists.reduce(
    (sum, checklist) => sum + checklist.items.filter((item) => item.completed).length,
    0
  );
  const activeGoalsCount = checklists.filter((checklist) =>
    checklist.items.some((item) => !item.completed)
  ).length;
  const nextTargetGoal = goals
    .filter((goal) => goal.targetDate)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())[0];
  const nextTargetLabel = nextTargetGoal
    ? new Date(nextTargetGoal.targetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No date set";

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

      <div className={styles.pageHeader}>
        <div className={styles.pageIntro}>
          <span className={styles.pageEyebrow}>Goals</span>
          <p className={styles.pageDescription}>
            See everything you&apos;re building at a glance and open the workspace that needs your attention next.
          </p>
        </div>

        {goals.length > 0 && (
          <button onClick={handleAddGoal} className={styles.addGoalButton} disabled={goals.length >= 10}>
            <IoAdd size={18} />
            {goals.length >= 10 ? "Goal Limit Reached (10)" : "Add Goal"}
          </button>
        )}
      </div>

      {goals.length > 0 && (
        <>
          <div className={styles.pageStats}>
            <div className={styles.pageStat}>
              <span className={styles.pageStatLabel}>Goal Count</span>
              <span className={styles.pageStatValue}>{goals.length}</span>
              <span className={styles.pageStatMeta}>
                {activeGoalsCount > 0 ? `${activeGoalsCount} with open checklist work` : "No active checklist work"}
              </span>
            </div>

            <div className={styles.pageStat}>
              <span className={styles.pageStatLabel}>Checklist Progress</span>
              <span className={styles.pageStatValue}>
                {completedChecklistItems}/{totalChecklistItems}
              </span>
              <span className={styles.pageStatMeta}>
                {totalChecklistItems > 0 ? "Items completed across your goals" : "No checklist items yet"}
              </span>
            </div>

            <div className={styles.pageStat}>
              <span className={styles.pageStatLabel}>Next Target</span>
              <span className={styles.pageStatValue}>{nextTargetLabel}</span>
              <span className={styles.pageStatMeta}>
                {nextTargetGoal ? nextTargetGoal.title : "Add a target date to anchor a goal"}
              </span>
            </div>
          </div>

          <div className={styles.goalsSectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Goal Workspaces</h2>
              <p className={styles.sectionDescription}>
                Open any card to jump into the full workspace for planning, journaling, and checklist progress.
              </p>
            </div>
            <span className={styles.sectionCount}>
              {goals.length} {goals.length === 1 ? "goal" : "goals"}
            </span>
          </div>
        </>
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
