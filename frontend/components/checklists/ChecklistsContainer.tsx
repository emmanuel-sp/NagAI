"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Checklist as ChecklistType } from "@/types/checklist";
import Checklist from "./Checklist";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { IoListOutline } from "@/components/icons";
import {
  fetchChecklists,
  createChecklistItem,
  updateChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/services/checklistService";
import {
  generateChecklistItem,
  generateFullChecklist,
} from "@/services/aiChecklistService";
import styles from "./checklist.module.css";

export default function ChecklistsContainer() {
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [checklists, setChecklists] = useState<ChecklistType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [generatingGoalId, setGeneratingGoalId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadChecklists();
    }
  }, [authLoading]);

  const loadChecklists = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchChecklists();
      setChecklists(data);
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

  const handleGenerateItem = async (goalId: number) => {
    setGeneratingGoalId(goalId);
    try {
      const checklist = checklists.find((c) => c.goalId === goalId);
      const suggestion = await generateChecklistItem(
        goalId,
        checklist?.items || []
      );
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

  const getFilteredChecklists = () => {
    return checklists.map((checklist) => {
      if (filter === "all") {
        const sortedItems = [...checklist.items].sort((a, b) => {
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        });
        return { ...checklist, items: sortedItems };
      }
      return {
        ...checklist,
        items:
          filter === "active"
            ? checklist.items.filter((item) => !item.completed)
            : checklist.items.filter((item) => item.completed),
      };
    });
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

        {/* Filter buttons */}
        <div className={styles.pageHeader}>
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
