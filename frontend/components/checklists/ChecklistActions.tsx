/**
 * ChecklistActions Component
 *
 * Action buttons for checklist - handles add item, AI suggest, and generate full checklist.
 *
 * Parent: Checklist
 * Children: None (presentational component)
 *
 * Props:
 * - hasItems: Whether checklist has any items
 * - isGenerating: Whether AI is currently generating items
 * - onAddItem: Callback to show add item form
 * - onGenerateItem: Callback to generate single item with AI
 * - onGenerateFullChecklist: Callback to generate full checklist with AI
 */

"use client";

import { IoAdd, IoSparkles } from "react-icons/io5";
import styles from "@/styles/checklist.module.css";

interface ChecklistActionsProps {
  hasItems: boolean;
  isGenerating: boolean;
  onAddItem: () => void;
  onGenerateItem: () => void;
  onGenerateFullChecklist: () => void;
}

export default function ChecklistActions({
  hasItems,
  isGenerating,
  onAddItem,
  onGenerateItem,
  onGenerateFullChecklist,
}: ChecklistActionsProps) {
  // If no items, show "Generate Checklist with AI" and "Add Item Manually"
  if (!hasItems) {
    return (
      <div className={styles.actionButtons}>
        <button
          onClick={onGenerateFullChecklist}
          className={styles.generateFullButton}
          disabled={isGenerating}
        >
          <IoSparkles size={20} />
          Generate Checklist with AI
        </button>
        <button onClick={onAddItem} className={styles.addItemButtonSecondary}>
          <IoAdd size={20} />
          Add Item Manually
        </button>
      </div>
    );
  }

  // If has items, show "Add Item" and "AI Suggest"
  return (
    <div className={styles.actionButtons}>
      <button onClick={onAddItem} className={styles.addItemButton}>
        <IoAdd size={20} />
        Add Item
      </button>
      <button
        onClick={onGenerateItem}
        className={styles.generateItemButton}
        disabled={isGenerating}
      >
        <IoSparkles size={18} />
        AI Suggest
      </button>
    </div>
  );
}
