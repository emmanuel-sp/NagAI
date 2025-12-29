/**
 * ChecklistsList Component
 *
 * Renders a list of checklists with all their items and actions.
 *
 * Parent: ChecklistsContainer
 * Children: Checklist (for each checklist)
 *
 * Props:
 * - checklists: Array of checklist objects
 * - generatingChecklistId: ID of checklist currently generating items (null if none)
 * - onAddItem: Callback to add a new item to a checklist
 * - onToggleItem: Callback to toggle item completion status
 * - onUpdateItem: Callback to update an item
 * - onDeleteItem: Callback to delete an item
 * - onGenerateItem: Callback to generate a single item with AI
 * - onGenerateFullChecklist: Callback to generate full checklist with AI
 */

"use client";

import { Checklist as ChecklistType } from "@/types/checklist";
import Checklist from "@/components/checklists/Checklist";
import styles from "@/styles/checklists/checklist.module.css";

interface ChecklistsListProps {
  checklists: ChecklistType[];
  filter: "all" | "active" | "completed";
  generatingChecklistId: string | null;
  onAddItem: (
    checklistId: string,
    title: string,
    notes?: string,
    deadline?: Date
  ) => void;
  onToggleItem: (checklistId: string, itemId: string) => void;
  onUpdateItem: (
    checklistId: string,
    itemId: string,
    updates: { title?: string; notes?: string; deadline?: Date }
  ) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onGenerateItem: (checklistId: string, goalId: string) => void;
  onGenerateFullChecklist: (checklistId: string, goalId: string) => void;
}

export default function ChecklistsList({
  checklists,
  filter,
  generatingChecklistId,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onGenerateItem,
  onGenerateFullChecklist,
}: ChecklistsListProps) {
  return (
    <div className={styles.checklistsList}>
      {checklists.map((checklist) => (
        <Checklist
          key={checklist.id}
          checklist={checklist}
          filter={filter}
          onAddItem={(title, notes, deadline) =>
            onAddItem(checklist.id, title, notes, deadline)
          }
          onToggleItem={(itemId) => onToggleItem(checklist.id, itemId)}
          onUpdateItem={(itemId, updates) =>
            onUpdateItem(checklist.id, itemId, updates)
          }
          onDeleteItem={(itemId) => onDeleteItem(checklist.id, itemId)}
          onGenerateItem={() => onGenerateItem(checklist.id, checklist.goalId)}
          onGenerateFullChecklist={() =>
            onGenerateFullChecklist(checklist.id, checklist.goalId)
          }
          isGenerating={generatingChecklistId === checklist.id}
        />
      ))}
    </div>
  );
}
