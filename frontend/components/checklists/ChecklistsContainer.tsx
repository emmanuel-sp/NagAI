"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Checklist as ChecklistType } from "@/types/checklist";
import { Goal } from "@/types/goal";
import Checklist from "./Checklist";
import DailyChecklistContainer from "./DailyChecklistContainer";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { IoListOutline } from "@/components/icons";
import { parseUtcDate } from "@/lib/dates";
import { fetchGoals } from "@/services/goalService";
import {
  fetchChecklists,
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
} from "@/services/checklistService";
import {
  generateChecklistItem,
  generateFullChecklist,
} from "@/services/aiChecklistService";
import styles from "./checklist.module.css";

export default function ChecklistsContainer() {
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [checklists, setChecklists] = useState<ChecklistType[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [generatingGoalId, setGeneratingGoalId] = useState<number | null>(null);
  const [linkedToggle, setLinkedToggle] = useState<{
    checklistId: number;
    completed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadChecklists();
    }
  }, [authLoading]);

  const loadChecklists = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [data, goalsData] = await Promise.all([
        fetchChecklists(),
        fetchGoals(),
      ]);
      setChecklists(data);
      setGoals(goalsData);
    } catch (error) {
      console.error("Failed to load checklists:", error);
      setLoadError("Failed to load checklists. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (
    goalId: number,
    title: string,
    notes?: string,
    deadline?: string
  ) => {
    try {
      const checklist = checklists.find((c) => c.goalId === goalId);
      const newItem = await createChecklistItem({
        goalId,
        title,
        notes,
        deadline,
        sortOrder: checklist ? checklist.items.length : 0,
      });
      setChecklists((prev) =>
        prev.map((c) =>
          c.goalId === goalId
            ? { ...c, items: [...c.items, newItem] }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleToggleItem = async (goalId: number, checklistId: number) => {
    try {
      const updated = await toggleChecklistItem(checklistId);
      setChecklists((prev) =>
        prev.map((c) =>
          c.goalId === goalId
            ? {
              ...c,
              items: c.items.map((i) =>
                i.checklistId === checklistId ? updated : i
              ),
            }
            : c
        )
      );
      // Mirror to daily plan locally
      setLinkedToggle({ checklistId, completed: updated.completed });
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  const handleUpdateItem = async (
    goalId: number,
    checklistId: number,
    updates: { title?: string; notes?: string; deadline?: string }
  ) => {
    try {
      const checklist = checklists.find((c) => c.goalId === goalId);
      const item = checklist?.items.find((i) => i.checklistId === checklistId);
      if (!item) return;

      const updated = await updateChecklistItem({
        checklistId,
        title: updates.title ?? item.title,
        notes: updates.notes ?? item.notes,
        deadline: updates.deadline ?? item.deadline,
        sortOrder: item.sortOrder,
        completed: item.completed,
      });
      setChecklists((prev) =>
        prev.map((c) =>
          c.goalId === goalId
            ? {
              ...c,
              items: c.items.map((i) =>
                i.checklistId === checklistId ? updated : i
              ),
            }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteItem = async (goalId: number, checklistId: number) => {
    try {
      await deleteChecklistItem(checklistId);
      setChecklists((prev) =>
        prev.map((c) =>
          c.goalId === goalId
            ? {
              ...c,
              items: c.items.filter((i) => i.checklistId !== checklistId),
            }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleReorderItems = async (goalId: number, orderedItemIds: number[]) => {
    try {
      const updatedItems = await reorderChecklistItems(goalId, { orderedItemIds });
      setChecklists((prev) =>
        prev.map((c) =>
          c.goalId === goalId ? { ...c, items: updatedItems } : c
        )
      );
    } catch (error) {
      console.error("Failed to reorder items:", error);
    }
  };

  const handleGenerateItem = async (goalId: number) => {
    setGeneratingGoalId(goalId);
    try {
      const checklist = checklists.find((c) => c.goalId === goalId);
      const suggestion = await generateChecklistItem(goalId);
      const newItem = await createChecklistItem({
        goalId,
        title: suggestion.title,
        notes: suggestion.notes,
        deadline: suggestion.deadline,
        sortOrder: checklist ? checklist.items.length : 0,
      });
      setChecklists((prev) =>
        prev.map((c) =>
          c.goalId === goalId
            ? { ...c, items: [...c.items, newItem] }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to generate item:", error);
    } finally {
      setGeneratingGoalId(null);
    }
  };

  const handleGenerateFullChecklist = async (goalId: number) => {
    setGeneratingGoalId(goalId);
    try {
      const suggestions = await generateFullChecklist(goalId);
      const newItems = await Promise.all(
        suggestions.map((s, i) =>
          createChecklistItem({
            goalId,
            title: s.title,
            notes: s.notes,
            deadline: s.deadline,
            sortOrder: i,
          })
        )
      );
      setChecklists((prev) =>
        prev.map((c) =>
          c.goalId === goalId ? { ...c, items: newItems } : c
        )
      );
    } catch (error) {
      console.error("Failed to generate checklist:", error);
    } finally {
      setGeneratingGoalId(null);
    }
  };

  const getLatestCompletedAt = (checklist: ChecklistType): number => {
    const times = checklist.items
      .filter((i) => i.completed && i.completedAt)
      .map((i) => parseUtcDate(i.completedAt!).getTime());
    return times.length ? Math.max(...times) : 0;
  };

  const getFilteredChecklists = () => {
    const mapped = checklists.map((checklist) => {
      if (filter === "all") {
        return {
          ...checklist,
          items: [...checklist.items].sort((a, b) => a.sortOrder - b.sortOrder),
        };
      }
      return {
        ...checklist,
        items: (
          filter === "active"
            ? checklist.items.filter((item) => !item.completed)
            : checklist.items.filter((item) => item.completed)
        ).sort((a, b) => a.sortOrder - b.sortOrder),
      };
    });

    return mapped.sort((a, b) => getLatestCompletedAt(b) - getLatestCompletedAt(a));
  };

  const filteredChecklists = getFilteredChecklists();

  if (isLoading) {
    return (
      <div className={styles.checklistsPage}>
        <LoadingSpinner message="Loading checklists..." />
      </div>
    );
  }

  return (
    <div className={styles.checklistsPage}>
      <div className={styles.checklistsContainer}>
        {loadError && <div className={styles.loadError}>{loadError}</div>}

        {/* Daily plan card — always at top */}
        <DailyChecklistContainer
          goals={goals}
          linkedToggle={linkedToggle}
          onLinkedItemToggled={(parentChecklistId, completed) => {
            setChecklists((prev) =>
              prev.map((c) => ({
                ...c,
                items: c.items.map((i) =>
                  i.checklistId === parentChecklistId
                    ? { ...i, completed, completedAt: completed ? new Date().toISOString() : undefined }
                    : i
                ),
              }))
            );
          }}
        />

        {/* Goal checklist filters */}
        <div className={styles.filterRow}>
          <div className={styles.filterButtons}>
            {(["all", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`${styles.filterButton} ${filter === f ? styles.filterButtonActive : ""}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredChecklists.length === 0 ? (
          <EmptyState
            icon={<IoListOutline size={80} />}
            title="No checklists yet"
            description="Checklists will be created automatically when you add goals."
          />
        ) : (
          <div className={styles.checklistsList}>
            {filteredChecklists.map((checklist) => (
              <Checklist
                key={checklist.goalId}
                checklist={checklist}
                filter={filter}
                onAddItem={(title, notes, deadline) =>
                  handleAddItem(checklist.goalId, title, notes, deadline)
                }
                onToggleItem={(checklistId) =>
                  handleToggleItem(checklist.goalId, checklistId)
                }
                onUpdateItem={(checklistId, updates) =>
                  handleUpdateItem(checklist.goalId, checklistId, updates)
                }
                onDeleteItem={(checklistId) =>
                  handleDeleteItem(checklist.goalId, checklistId)
                }
                onReorderItems={(orderedItemIds) =>
                  handleReorderItems(checklist.goalId, orderedItemIds)
                }
                onGenerateItem={() =>
                  handleGenerateItem(checklist.goalId)
                }
                onGenerateFullChecklist={() =>
                  handleGenerateFullChecklist(checklist.goalId)
                }
                isGenerating={generatingGoalId === checklist.goalId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
