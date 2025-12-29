/**
 * ChecklistsContainer Component
 *
 * Main container component for the Checklists page that handles all business logic and state management.
 *
 * Component Hierarchy:
 * - ChecklistsContainer (this component)
 *   ├── ChecklistsHeader
 *   ├── ChecklistsEmptyState (when no checklists)
 *   └── ChecklistsList
 *       └── Checklist (for each checklist)
 *           ├── ChecklistHeader
 *           ├── ChecklistItemsList
 *           │   └── ChecklistItem (for each item)
 *           └── ChecklistActions
 *
 * Responsibilities:
 * - Fetch and manage checklists data
 * - Handle checklist item CRUD operations
 * - Manage AI generation state
 * - Handle filtering (all/active/completed)
 * - Coordinate between child components
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Checklist as ChecklistType } from "@/types/checklist";
import ChecklistsHeader from "@/components/checklists/ChecklistsHeader";
import ChecklistsEmptyState from "@/components/checklists/ChecklistsEmptyState";
import ChecklistsList from "@/components/checklists/ChecklistsList";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  fetchChecklists,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/services/checklistService";
import {
  generateChecklistItem,
  generateFullChecklist,
} from "@/services/aiChecklistService";
import styles from "@/styles/checklists/checklist.module.css";

export default function ChecklistsContainer() {
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [checklists, setChecklists] = useState<ChecklistType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [generatingChecklistId, setGeneratingChecklistId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadChecklists();
    }
  }, [authLoading]);

  const loadChecklists = async () => {
    try {
      setIsLoading(true);
      const data = await fetchChecklists();
      setChecklists(data);
    } catch (error) {
      console.error("Failed to load checklists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (
    checklistId: string,
    title: string,
    notes?: string,
    deadline?: Date
  ) => {
    try {
      const newItem = await createChecklistItem(checklistId, {
        title,
        notes,
        deadline,
      });

      setChecklists((prev) =>
        prev.map((checklist) =>
          checklist.id === checklistId
            ? {
                ...checklist,
                items: [...checklist.items, newItem],
                updatedAt: new Date(),
              }
            : checklist
        )
      );
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string) => {
    const checklist = checklists.find((c) => c.id === checklistId);
    const item = checklist?.items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      await updateChecklistItem(checklistId, itemId, {
        completed: !item.completed,
      });

      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === itemId
                    ? {
                        ...i,
                        completed: !i.completed,
                        completedAt: !i.completed ? new Date() : undefined,
                      }
                    : i
                ),
                updatedAt: new Date(),
              }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  const handleUpdateItem = async (
    checklistId: string,
    itemId: string,
    updates: { title?: string; notes?: string; deadline?: Date }
  ) => {
    try {
      await updateChecklistItem(checklistId, itemId, updates);

      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === itemId ? { ...i, ...updates } : i
                ),
                updatedAt: new Date(),
              }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    try {
      await deleteChecklistItem(checklistId, itemId);

      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items.filter((i) => i.id !== itemId),
                updatedAt: new Date(),
              }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleGenerateItem = async (checklistId: string, goalId: string) => {
    setGeneratingChecklistId(checklistId);
    try {
      const checklist = checklists.find((c) => c.id === checklistId);
      const newItem = await generateChecklistItem(goalId, checklist?.items || []);

      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: [...c.items, newItem],
                updatedAt: new Date(),
              }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to generate item:", error);
    } finally {
      setGeneratingChecklistId(null);
    }
  };

  const handleGenerateFullChecklist = async (checklistId: string, goalId: string) => {
    setGeneratingChecklistId(checklistId);
    try {
      const newItems = await generateFullChecklist(goalId);

      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: newItems,
                updatedAt: new Date(),
              }
            : c
        )
      );
    } catch (error) {
      console.error("Failed to generate checklist:", error);
    } finally {
      setGeneratingChecklistId(null);
    }
  };

  const getFilteredChecklists = () => {
    return checklists.map((checklist) => {
      if (filter === "all") {
        // Sort items: active items first, completed items at the bottom
        const sortedItems = [...checklist.items].sort((a, b) => {
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        });
        return {
          ...checklist,
          items: sortedItems,
        };
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
        <ChecklistsHeader filter={filter} onFilterChange={setFilter} />

        {filteredChecklists.length === 0 ? (
          <ChecklistsEmptyState />
        ) : (
          <ChecklistsList
            checklists={filteredChecklists}
            filter={filter}
            generatingChecklistId={generatingChecklistId}
            onAddItem={handleAddItem}
            onToggleItem={handleToggleItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onGenerateItem={handleGenerateItem}
            onGenerateFullChecklist={handleGenerateFullChecklist}
          />
        )}
      </div>
    </div>
  );
}
