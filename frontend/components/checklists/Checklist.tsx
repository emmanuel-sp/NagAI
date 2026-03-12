"use client";

import { useState } from "react";
import { Checklist as ChecklistType } from "@/types/checklist";
import ChecklistItem from "./ChecklistItem";
import AddItemForm from "./AddItemForm";
import { IoAdd, IoSparkles } from "@/components/icons";
import styles from "./checklist.module.css";

interface ChecklistProps {
  checklist: ChecklistType;
  filter: "all" | "active" | "completed";
  onAddItem: (title: string, notes?: string, deadline?: string) => void;
  onToggleItem: (checklistId: number) => void;
  onUpdateItem: (checklistId: number, updates: { title?: string; notes?: string; deadline?: string }) => void;
  onDeleteItem: (checklistId: number) => void;
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
    if (a.completed != b.completed) return a.completed ? 1 : -1;
    return a.sortOrder - b.sortOrder;
  });
  const completedCount = checklist.items.filter((item) => item.completed).length;
  const totalCount = checklist.items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const shouldShowActions = filter !== "completed";

  const getEmptyStateMessage = () => {
    if (filter === "completed") return "No completed items yet.";
    if (filter === "active") return "No active items. Generate a checklist with AI or add your first item!";
    return "No checklist items yet. Generate a checklist with AI or add your first item!";
  };

  const handleAdd = (title: string, notes?: string, deadline?: string) => {
    onAddItem(title, notes, deadline);
    setIsAdding(false);
  };

  return (
    <div className={styles.checklist}>
      {/* Header with progress */}
      <div className={styles.checklistHeader}>
        <div className={styles.checklistHeaderInfo}>
          <h2 className={styles.checklistGoalTitle}>{checklist.goalTitle || "Untitled Goal"}</h2>
          {filter == "all" &&
          <div className={styles.checklistProgress}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
            <span className={styles.progressText}>
              {completedCount} of {totalCount} completed
            </span>
          </div>
          }
        </div>
      </div>

      {/* Items */}
      <div className={styles.checklistItems}>
        {sortedItems.map((item) => (
          <ChecklistItem key={item.checklistId} item={item} onToggle={onToggleItem} onUpdate={onUpdateItem} onDelete={onDeleteItem} />
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

      {/* Actions */}
      {shouldShowActions && !isAdding && !isGenerating ? (
        <div className={styles.actionButtons}>
          {sortedItems.length === 0 ? (
            <>
              <button onClick={onGenerateFullChecklist || (() => {})} className={styles.generateFullButton} disabled={isGenerating}>
                <IoSparkles size={20} />
                Generate Checklist with AI
              </button>
              <button onClick={() => setIsAdding(true)} className={styles.addItemButtonSecondary}>
                <IoAdd size={20} />
                Add Item Manually
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsAdding(true)} className={styles.addItemButton}>
                <IoAdd size={20} />
                Add Item
              </button>
              <button onClick={onGenerateItem || (() => {})} className={styles.generateItemButton} disabled={isGenerating}>
                <IoSparkles size={18} />
                AI Suggest
              </button>
            </>
          )}
        </div>
      ) : shouldShowActions && isAdding ? (
        <AddItemForm onAdd={handleAdd} onCancel={() => setIsAdding(false)} />
      ) : null}
    </div>
  );
}
