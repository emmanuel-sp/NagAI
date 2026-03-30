"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAgentData } from "@/contexts/AgentDataContext";
import { GoalWithDetails } from "@/types/goal";
import { Checklist as ChecklistType } from "@/types/checklist";
import { AgentContext, CreateContextRequest } from "@/types/agent";
import GoalFormModal from "@/components/goals/GoalFormModal";
import GoalJournalCard from "@/components/goals/GoalJournalCard";
import ContextFormModal from "@/components/agent-builder/ContextFormModal";
import Checklist from "@/components/checklists/Checklist";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { IoAdd, IoCalendarOutline, IoPencil, IoSettings, IoSparkles } from "@/components/icons";
import { parseUtcDate } from "@/lib/dates";
import {
  fetchGoalById,
  updateGoal,
  deleteGoal,
  updateGoalJournal,
} from "@/services/goalService";
import {
  fetchChecklistByGoal,
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/services/checklistService";
import {
  generateChecklistItem,
  generateFullChecklist,
} from "@/services/aiChecklistService";
import styles from "./goalWorkspace.module.css";

interface GoalWorkspaceContainerProps {
  goalId: number;
}

function formatGoalDate(dateString?: string) {
  if (!dateString) return null;
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function GoalWorkspaceContainer({ goalId }: GoalWorkspaceContainerProps) {
  const router = useRouter();
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const {
    agent,
    goals,
    loading: agentLoading,
    handleCreateContext,
    handleUpdateContext,
    handleDeleteContext,
    refreshAgent,
  } = useAgentData();

  const [goal, setGoal] = useState<GoalWithDetails | null>(null);
  const [checklist, setChecklist] = useState<ChecklistType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isCreateContextOpen, setIsCreateContextOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<AgentContext | null>(null);
  const [generatingChecklist, setGeneratingChecklist] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      void loadGoalWorkspace();
    }
  }, [authLoading, goalId]);

  const loadGoalWorkspace = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [goalData, checklistData] = await Promise.all([
        fetchGoalById(goalId),
        fetchChecklistByGoal(goalId),
      ]);
      setGoal(goalData);
      setChecklist({ ...checklistData, goalTitle: goalData.title });
    } catch (error) {
      console.error("Failed to load goal workspace:", error);
      setLoadError("We couldn’t load this goal right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goalContexts = useMemo(
    () => (agent?.contexts ?? []).filter((context) => context.goalId === goalId),
    [agent?.contexts, goalId]
  );

  const totalContextCount = agent?.contexts.length ?? 0;
  const canCreateContext = totalContextCount < 4;
  const totalItems = checklist?.items.length ?? 0;
  const completedItems = checklist?.items.filter((item) => item.completed).length ?? 0;
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const syncChecklistItem = (updater: (current: ChecklistType) => ChecklistType) => {
    setChecklist((current) => (current ? updater(current) : current));
  };

  const handleChecklistAdd = async (title: string, notes?: string, deadline?: string) => {
    if (!checklist) return;
    const newItem = await createChecklistItem({
      goalId,
      title,
      notes,
      deadline,
      sortOrder: checklist.items.length,
    });
    syncChecklistItem((current) => ({
      ...current,
      items: [...current.items, newItem],
    }));
  };

  const handleChecklistToggle = async (checklistId: number) => {
    const updated = await toggleChecklistItem(checklistId);
    syncChecklistItem((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.checklistId === checklistId ? updated : item
      ),
    }));
  };

  const handleChecklistUpdate = async (
    checklistId: number,
    updates: { title?: string; notes?: string; deadline?: string }
  ) => {
    if (!checklist) return;
    const currentItem = checklist.items.find((item) => item.checklistId === checklistId);
    if (!currentItem) return;

    const updated = await updateChecklistItem({
      checklistId,
      title: updates.title ?? currentItem.title,
      notes: updates.notes ?? currentItem.notes,
      deadline: updates.deadline ?? currentItem.deadline,
      sortOrder: currentItem.sortOrder,
      completed: currentItem.completed,
    });

    syncChecklistItem((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.checklistId === checklistId ? updated : item
      ),
    }));
  };

  const handleChecklistDelete = async (checklistId: number) => {
    await deleteChecklistItem(checklistId);
    syncChecklistItem((current) => ({
      ...current,
      items: current.items.filter((item) => item.checklistId !== checklistId),
    }));
  };

  const handleGenerateChecklistItem = async () => {
    if (!checklist) return;
    setGeneratingChecklist(true);
    try {
      const suggestion = await generateChecklistItem(goalId);
      const item = await createChecklistItem({
        goalId,
        title: suggestion.title,
        notes: suggestion.notes,
        deadline: suggestion.deadline,
        sortOrder: checklist.items.length,
      });
      syncChecklistItem((current) => ({
        ...current,
        items: [...current.items, item],
      }));
    } finally {
      setGeneratingChecklist(false);
    }
  };

  const handleGenerateFullChecklist = async () => {
    setGeneratingChecklist(true);
    try {
      const suggestions = await generateFullChecklist(goalId);
      const newItems = await Promise.all(
        suggestions.map((suggestion, index) =>
          createChecklistItem({
            goalId,
            title: suggestion.title,
            notes: suggestion.notes,
            deadline: suggestion.deadline,
            sortOrder: index,
          })
        )
      );
      syncChecklistItem((current) => ({
        ...current,
        items: newItems,
      }));
    } finally {
      setGeneratingChecklist(false);
    }
  };

  const handleGoalUpdate = async (updates: GoalWithDetails) => {
    const updatedGoal = await updateGoal(updates.goalId, updates);
    setGoal(updatedGoal);
    setChecklist((current) => current ? { ...current, goalTitle: updatedGoal.title } : current);
    setIsEditGoalOpen(false);
    await refreshAgent();
  };

  const handleGoalDelete = async (currentGoalId: number) => {
    await deleteGoal(currentGoalId);
    await refreshAgent();
    router.push("/goals");
  };

  const handleJournalSave = async (journalMarkdown: string) => {
    const updatedGoal = await updateGoalJournal(goalId, journalMarkdown);
    setGoal(updatedGoal);
  };

  const handleCreateContextSubmit = async (data: CreateContextRequest) => {
    const created = await handleCreateContext(data);
    if (created) {
      setIsCreateContextOpen(false);
    }
  };

  const handleUpdateContextSubmit = async (contextId: number, data: CreateContextRequest) => {
    const updated = await handleUpdateContext(contextId, data);
    if (updated) {
      setSelectedContext(null);
    }
  };

  if (isLoading || authLoading || agentLoading) {
    return (
      <div className={styles.workspaceShell}>
        <LoadingSpinner message="Loading goal workspace..." />
      </div>
    );
  }

  if (loadError || !goal || !checklist) {
    return (
      <div className={styles.workspaceShell}>
        <EmptyState
          title="Goal unavailable"
          description={loadError ?? "We couldn’t find this goal."}
          action={
            <Link href="/goals" className={styles.primaryLink}>
              Back to goals
            </Link>
          }
        />
      </div>
    );
  }

  const goalOptions = [goal, ...goals.filter((entry) => entry.goalId !== goal.goalId)];

  return (
    <div className={styles.workspaceShell}>
      <div className={styles.workspaceHeaderRow}>
        <Link href="/goals" className={styles.backLink}>
          ← All goals
        </Link>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setIsEditGoalOpen(true)}
        >
          <IoPencil size={14} />
          Edit Goal
        </button>
      </div>

      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <div className={styles.heroMeta}>
            {goal.targetDate && (
              <span className={styles.metaPill}>
                <IoCalendarOutline size={14} />
                Target {formatGoalDate(goal.targetDate)}
              </span>
            )}
            <span className={styles.metaPillMuted}>
              Created {parseUtcDate(goal.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className={styles.heroTitle}>{goal.title}</h1>
          {goal.description && (
            <p className={styles.heroDescription}>{goal.description}</p>
          )}
          <div className={styles.progressSummary}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {completedItems} of {totalItems} checklist items completed
            </span>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Checklist</span>
            <strong className={styles.statValue}>{totalItems}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Contexts</span>
            <strong className={styles.statValue}>{goalContexts.length}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Journal</span>
            <strong className={styles.statValue}>
              {goal.journalMarkdown?.trim() ? "Active" : "Empty"}
            </strong>
          </div>
        </div>
      </section>

      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Checklist</h2>
                <p className={styles.sectionSubtitle}>
                  Track the concrete tasks that move this goal forward.
                </p>
              </div>
            </div>
            <Checklist
              title="Checklist"
              checklist={checklist}
              filter="all"
              onAddItem={handleChecklistAdd}
              onToggleItem={handleChecklistToggle}
              onUpdateItem={handleChecklistUpdate}
              onDeleteItem={handleChecklistDelete}
              onGenerateItem={handleGenerateChecklistItem}
              onGenerateFullChecklist={handleGenerateFullChecklist}
              isGenerating={generatingChecklist}
            />
          </section>
        </div>

        <div className={styles.sideColumn}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Goal Contexts</h2>
                <p className={styles.sectionSubtitle}>
                  These are the agent behaviors attached to this goal only.
                </p>
              </div>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={!canCreateContext}
                onClick={() => setIsCreateContextOpen(true)}
              >
                <IoAdd size={14} />
                {canCreateContext ? "Add Context" : "Limit Reached"}
              </button>
            </div>

            {goalContexts.length === 0 ? (
              <EmptyState
                icon={<IoSettings size={44} />}
                title="No contexts for this goal yet"
                description="Create a goal-specific context when you want the agent to help with motivation, guidance, or more direct nudges."
              />
            ) : (
              <div className={styles.contextList}>
                {goalContexts.map((context) => (
                  <article key={context.contextId} className={styles.contextCard}>
                    <div className={styles.contextCardHeader}>
                      <div>
                        <h3 className={styles.contextName}>{context.name}</h3>
                        <span className={styles.contextType}>{context.messageType}</span>
                      </div>
                      <div className={styles.contextActions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => setSelectedContext(context)}
                        >
                          <IoPencil size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          onClick={() =>
                            setConfirmAction({
                              title: "Delete Context",
                              message: `Remove "${context.name}" from this goal?`,
                              confirmLabel: "Delete",
                              destructive: true,
                              onConfirm: async () => {
                                await handleDeleteContext(context.contextId);
                                setConfirmAction(null);
                              },
                            })
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {context.customInstructions ? (
                      <p className={styles.contextInstructions}>{context.customInstructions}</p>
                    ) : (
                      <p className={styles.contextInstructionsMuted}>
                        No custom instructions yet.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            {!canCreateContext && (
              <p className={styles.limitNote}>
                You can have up to 4 contexts across all goals.
              </p>
            )}
          </section>

          <GoalJournalCard
            value={goal.journalMarkdown}
            onSave={handleJournalSave}
          />
        </div>
      </div>

      <section className={styles.smartSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>SMART framing</h2>
            <p className={styles.sectionSubtitle}>
              The original structure for why this goal matters and how it should work.
            </p>
          </div>
          <span className={styles.smartSpark}>
            <IoSparkles size={14} />
            Goal structure
          </span>
        </div>
        <div className={styles.smartGrid}>
          {[
            { label: "Specific", value: goal.specific },
            { label: "Measurable", value: goal.measurable },
            { label: "Attainable", value: goal.attainable },
            { label: "Relevant", value: goal.relevant },
            { label: "Timely", value: goal.timely },
            { label: "Steps Taken", value: goal.stepsTaken },
          ]
            .filter((item) => item.value)
            .map((item) => (
              <article key={item.label} className={styles.smartCard}>
                <span className={styles.smartLabel}>{item.label}</span>
                <p className={styles.smartValue}>{item.value}</p>
              </article>
            ))}
        </div>
      </section>

      <GoalFormModal
        mode="edit"
        isOpen={isEditGoalOpen}
        goal={goal}
        onClose={() => setIsEditGoalOpen(false)}
        onSubmit={handleGoalUpdate}
        onRemove={handleGoalDelete}
      />

      <ContextFormModal
        mode="create"
        isOpen={isCreateContextOpen}
        goals={goalOptions}
        lockedGoalId={goal.goalId}
        onClose={() => setIsCreateContextOpen(false)}
        onSubmit={handleCreateContextSubmit}
      />

      {selectedContext && (
        <ContextFormModal
          mode="edit"
          isOpen={!!selectedContext}
          goals={goalOptions}
          lockedGoalId={goal.goalId}
          context={selectedContext}
          onClose={() => setSelectedContext(null)}
          onSubmit={handleUpdateContextSubmit}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.message ?? ""}
        confirmLabel={confirmAction?.confirmLabel ?? "Confirm"}
        destructive={confirmAction?.destructive}
        onConfirm={() => void confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
