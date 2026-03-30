"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAgentData } from "@/contexts/AgentDataContext";
import { GoalWithDetails } from "@/types/goal";
import { Checklist as ChecklistType } from "@/types/checklist";
import { CreateContextRequest, MessageType } from "@/types/agent";
import GoalFormModal from "@/components/goals/GoalFormModal";
import GoalJournalCard from "@/components/goals/GoalJournalCard";
import Checklist from "@/components/checklists/Checklist";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { IoCalendarOutline, IoPencil, IoSparkles } from "@/components/icons";
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

interface ContextDraft {
  name: string;
  messageType: MessageType;
  customInstructions: string;
}

function formatGoalDate(dateString?: string) {
  if (!dateString) return null;
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDefaultContext(goalTitle: string): ContextDraft {
  return {
    name: `${goalTitle} support`,
    messageType: "motivation",
    customInstructions: "",
  };
}

export default function GoalWorkspaceContainer({ goalId }: GoalWorkspaceContainerProps) {
  const router = useRouter();
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const {
    agent,
    loading: agentLoading,
    handleCreateContext,
    handleUpdateContext,
    handleDeleteContext,
    handleDeployContext,
    handleStopContext,
    refreshAgent,
  } = useAgentData();

  const [goal, setGoal] = useState<GoalWithDetails | null>(null);
  const [checklist, setChecklist] = useState<ChecklistType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [generatingChecklist, setGeneratingChecklist] = useState(false);
  const [contextDraft, setContextDraft] = useState<ContextDraft>(getDefaultContext("Goal"));
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [isTogglingContext, setIsTogglingContext] = useState(false);
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

  const currentContext = goalContexts[0] ?? null;
  const totalContextCount = agent?.contexts.length ?? 0;
  const canCreateContext = !!currentContext || totalContextCount < 3;
  const totalItems = checklist?.items.length ?? 0;
  const completedItems = checklist?.items.filter((item) => item.completed).length ?? 0;
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  useEffect(() => {
    if (!goal) return;
    if (currentContext) {
      setContextDraft({
        name: currentContext.name,
        messageType: currentContext.messageType,
        customInstructions: currentContext.customInstructions ?? "",
      });
      return;
    }
    setContextDraft(getDefaultContext(goal.title));
  }, [currentContext, goal]);

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

  const handleContextSave = async () => {
    const payload: CreateContextRequest = {
      goalId,
      name: contextDraft.name.trim() || `${goal?.title ?? "Goal"} support`,
      messageType: contextDraft.messageType,
      customInstructions: contextDraft.customInstructions.trim() || undefined,
    };

    setIsSavingContext(true);
    try {
      if (currentContext) {
        await handleUpdateContext(currentContext.contextId, payload);
      } else {
        await handleCreateContext(payload);
      }
    } finally {
      setIsSavingContext(false);
    }
  };

  const handleContextDeployment = async () => {
    if (!currentContext) return;
    setIsTogglingContext(true);
    try {
      if (currentContext.deployed) {
        await handleStopContext(currentContext.contextId);
      } else {
        await handleDeployContext(currentContext.contextId);
      }
    } finally {
      setIsTogglingContext(false);
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

  const contextDirty = currentContext
    ? contextDraft.name !== currentContext.name ||
      contextDraft.messageType !== currentContext.messageType ||
      contextDraft.customInstructions !== (currentContext.customInstructions ?? "")
    : contextDraft.name.trim().length > 0 || contextDraft.customInstructions.trim().length > 0;

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
            <span className={styles.statLabel}>Goal Agent</span>
            <strong className={styles.statValue}>
              {currentContext ? (currentContext.deployed ? "Live" : "Draft") : "Not set"}
            </strong>
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
                <h2 className={styles.sectionTitle}>Goal Agent</h2>
                <p className={styles.sectionSubtitle}>
                  One configurable agent context per goal, with deploy control built right into the page.
                </p>
              </div>
              <span
                className={`${styles.deploymentPill} ${
                  currentContext?.deployed ? styles.deploymentPillActive : styles.deploymentPillIdle
                }`}
              >
                {currentContext ? (currentContext.deployed ? "Live" : "Draft") : "Not set"}
              </span>
            </div>

            {!currentContext && !canCreateContext && (
              <div className={styles.contextLimitBanner}>
                You already have 3 goal agents. Remove one from another goal before creating a new one here.
              </div>
            )}

            <div className={styles.contextEditor}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Context name</label>
                <input
                  type="text"
                  value={contextDraft.name}
                  onChange={(event) =>
                    setContextDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="How should this goal agent be named?"
                  maxLength={100}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Message style</label>
                <select
                  value={contextDraft.messageType}
                  onChange={(event) =>
                    setContextDraft((current) => ({
                      ...current,
                      messageType: event.target.value as MessageType,
                    }))
                  }
                >
                  <option value="nag">Nag</option>
                  <option value="motivation">Motivation</option>
                  <option value="guidance">Guidance</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Custom instructions</label>
                <textarea
                  value={contextDraft.customInstructions}
                  onChange={(event) =>
                    setContextDraft((current) => ({
                      ...current,
                      customInstructions: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Tell the agent how to support this goal."
                  maxLength={2000}
                />
              </div>

              <div className={styles.contextActionsRow}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={!canCreateContext || !contextDirty || isSavingContext}
                  onClick={() => void handleContextSave()}
                >
                  {isSavingContext
                    ? "Saving..."
                    : currentContext
                      ? "Save Goal Agent"
                      : "Create Goal Agent"}
                </button>

                <button
                  type="button"
                  className={styles.deployActionButton}
                  disabled={!currentContext || isTogglingContext}
                  onClick={() => void handleContextDeployment()}
                >
                  {isTogglingContext
                    ? "Updating..."
                    : currentContext?.deployed
                      ? "Stop"
                      : "Deploy"}
                </button>

                {currentContext && (
                  <button
                    type="button"
                    className={styles.dangerTextButton}
                    onClick={() =>
                      setConfirmAction({
                        title: "Remove Goal Agent",
                        message: `Delete "${currentContext.name}" from this goal?`,
                        confirmLabel: "Delete",
                        destructive: true,
                        onConfirm: async () => {
                          await handleDeleteContext(currentContext.contextId);
                          setConfirmAction(null);
                        },
                      })
                    }
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className={styles.contextHelper}>
                {currentContext
                  ? "Save configuration changes here, then deploy when you want this goal agent to start nudging."
                  : "Create the goal agent here first. Deployment becomes available once the context exists."}
              </p>
            </div>
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
