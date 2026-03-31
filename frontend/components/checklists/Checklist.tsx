"use client";

import { useState } from "react";
import { Checklist as ChecklistType } from "@/types/checklist";
import ChecklistItem from "./ChecklistItem";
import AddItemForm from "./AddItemForm";
import { IoAdd, IoSparkles, IoChevronDown } from "@/components/icons";
import styles from "./checklist.module.css";

interface ChecklistProps {
  checklist: ChecklistType;
  filter: "all" | "active" | "completed";
  title?: string;
  onAddItem: (title: string, notes?: string, deadline?: string) => void;
  onToggleItem: (checklistId: number) => void;
  onUpdateItem: (checklistId: number, updates: { title?: string; notes?: string; deadline?: string }) => void;
  onDeleteItem: (checklistId: number) => void;
  onReorderItems?: (orderedItemIds: number[]) => Promise<void> | void;
  onGenerateItem?: () => void;
  onGenerateFullChecklist?: () => void;
  isGenerating?: boolean;
}

export default function Checklist({
  checklist,
  filter,
  title,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onGenerateItem,
  onGenerateFullChecklist,
  isGenerating = false,
}: ChecklistProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sortedItems = [...checklist.items].sort((a, b) => a.sortOrder - b.sortOrder);
  const movableIds = sortedItems
    .filter((item) => !item.deadline)
    .map((item) => item.checklistId);
  const completedCount = checklist.items.filter((item) => item.completed).length;
  const totalCount = checklist.items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const shouldShowActions = filter !== "completed";
  const atItemLimit = totalCount >= 20;

  const getEmptyStateMessage = () => {
    if (filter === "completed") return "No completed items yet.";
    if (filter === "active") return "No active items. Generate a checklist with AI or add your first item!";
    return "No checklist items yet. Generate a checklist with AI or add your first item!";
  };

  const handleAdd = (title: string, notes?: string, deadline?: string) => {
    onAddItem(title, notes, deadline);
    setIsAdding(false);
  };

  const handleReorder = (checklistId: number, direction: -1 | 1) => {
    if (!onReorderItems) return;
    const currentIndex = movableIds.indexOf(checklistId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= movableIds.length) return;

    const orderedItemIds = [...movableIds];
    [orderedItemIds[currentIndex], orderedItemIds[targetIndex]] = [
      orderedItemIds[targetIndex],
      orderedItemIds[currentIndex],
    ];
    void onReorderItems(orderedItemIds);
  };

  return (
    <div className={styles.checklist}>
      {/* Header with progress */}
      <div className={styles.checklistHeader} onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: "pointer" }}>
        <div className={styles.checklistHeaderInfo}>
          <div className={styles.checklistTitleRow}>
            <h2 className={styles.checklistGoalTitle}>{title || checklist.goalTitle || "Untitled Goal"}</h2>
            <span className={`${styles.collapseIcon} ${isCollapsed ? styles.collapseIconCollapsed : ""}`}>
              <IoChevronDown size={18} />
            </span>
          </div>
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
      {!isCollapsed && (
        <>
        <div className={styles.checklistItems}>
          {sortedItems.map((item) => {
            const movableIndex = movableIds.indexOf(item.checklistId);
            return (
              <ChecklistItem
                key={item.checklistId}
                item={item}
                onToggle={onToggleItem}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                onMoveUp={!item.deadline ? () => handleReorder(item.checklistId, -1) : undefined}
                onMoveDown={!item.deadline ? () => handleReorder(item.checklistId, 1) : undefined}
                canMoveUp={!item.deadline && movableIndex > 0}
                canMoveDown={!item.deadline && movableIndex < movableIds.length - 1}
              />
            );
          })}

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
                
                Generate Checklist with AI
              </button>
              <button onClick={() => setIsAdding(true)} className={styles.addItemButtonSecondary}>
                <IoAdd size={20} />
                Add Item Manually
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsAdding(true)} className={styles.addItemButton} disabled={atItemLimit}>
                <IoAdd size={20} />
                {atItemLimit ? "Item Limit (20)" : "Add Item"}
              </button>
              <button onClick={onGenerateItem || (() => {})} className={styles.generateItemButton} disabled={isGenerating || atItemLimit}>
                AI Suggest
              </button>
            </>
          )}
        </div>
      ) : shouldShowActions && isAdding ? (
        <AddItemForm onAdd={handleAdd} onCancel={() => setIsAdding(false)} />
      ) : null}
        </>
      )}
    </div>
  );
}
