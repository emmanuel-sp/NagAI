/**
 * Checklist Component
 *
 * Individual checklist component that displays checklist items and manages add/edit state.
 *
 * Parent: ChecklistsList
 * Children:
 * - ChecklistHeader
 * - ChecklistItem (for each item)
 * - ChecklistActions
 * - AddItemForm (when adding new item)
 *
 * Props:
 * - checklist: Checklist data object
 * - onAddItem: Callback to add a new item
 * - onToggleItem: Callback to toggle item completion
 * - onUpdateItem: Callback to update an item
 * - onDeleteItem: Callback to delete an item
 * - onGenerateItem: Callback to generate single item with AI
 * - onGenerateFullChecklist: Callback to generate full checklist with AI
 * - isGenerating: Whether AI is currently generating items
 */

"use client";

import { useState } from "react";
import { Checklist as ChecklistType } from "@/types/checklist";
import ChecklistHeader from "./ChecklistHeader";
import ChecklistItem from "./ChecklistItem";
import ChecklistActions from "./ChecklistActions";
import AddItemForm from "./AddItemForm";
import styles from "@/styles/checklists/checklist.module.css";

interface ChecklistProps {
  checklist: ChecklistType;
  filter: "all" | "active" | "completed";
  onAddItem: (title: string, notes?: string, deadline?: Date) => void;
  onToggleItem: (itemId: string) => void;
  onUpdateItem: (
    itemId: string,
    updates: { title?: string; notes?: string; deadline?: Date }
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onGenerateItem?: () => void;
  onGenerateFullChecklist?: () => void;
  isGenerating?: boolean;
}

export default function Checklist({
  checklist,
  filter,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onGenerateItem,
  onGenerateFullChecklist,
  isGenerating = false,
}: ChecklistProps) {
  const [isAdding, setIsAdding] = useState(false);

  const sortedItems = [...checklist.items].sort((a, b) => {
    if (a.completed != b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.order - b.order
  });
  const completedCount = checklist.items.filter((item) => item.completed).length;
  const totalCount = checklist.items.length;

  // Determine if actions should be shown based on filter
  const shouldShowActions = filter !== "completed";

  // Get appropriate empty state message based on filter
  const getEmptyStateMessage = () => {
    if (filter === "completed") {
      return "No completed items yet.";
    }
    if (filter === "active") {
      return "No active items. Generate a checklist with AI or add your first item!";
    }
    return "No checklist items yet. Generate a checklist with AI or add your first item!";
  };

  const handleAdd = (title: string, notes?: string, deadline?: Date) => {
    onAddItem(title, notes, deadline);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
  };

  return (
    <div className={styles.checklist}>
      <ChecklistHeader
        goalTitle={checklist.goalTitle || "Untitled Goal"}
        completedCount={completedCount}
        totalCount={totalCount}
      />

      <div className={styles.checklistItems}>
        {sortedItems.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={onToggleItem}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
          />
        ))}

        {sortedItems.length === 0 && !isAdding && !isGenerating && (
          <div className={styles.emptyState}>
            <p>{getEmptyStateMessage()}</p>
          </div>
        )}

        {isGenerating && (
          <div className={styles.generatingState}>
            <div className={styles.generatingSpinner}></div>
            <p>AI is generating checklist items...</p>
          </div>
        )}
      </div>

      {shouldShowActions && !isAdding && !isGenerating ? (
        <ChecklistActions
          hasItems={sortedItems.length > 0}
          isGenerating={isGenerating}
          onAddItem={() => setIsAdding(true)}
          onGenerateItem={onGenerateItem || (() => {})}
          onGenerateFullChecklist={onGenerateFullChecklist || (() => {})}
        />
      ) : shouldShowActions && isAdding ? (
        <AddItemForm onAdd={handleAdd} onCancel={handleCancel} />
      ) : null}
    </div>
  );
}
