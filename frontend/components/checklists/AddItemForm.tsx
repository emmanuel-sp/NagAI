/**
 * AddItemForm Component
 *
 * Form for adding a new checklist item with title, notes, and deadline.
 *
 * Parent: Checklist
 * Children: None (form component)
 *
 * Props:
 * - onAdd: Callback to add item (title, notes?, deadline?)
 * - onCancel: Callback to cancel and hide form
 */

"use client";

import { useState } from "react";
import { IoCalendarOutline } from "react-icons/io5";
import styles from "@/styles/checklists/checklist.module.css";

interface AddItemFormProps {
  onAdd: (title: string, notes?: string, deadline?: Date) => void;
  onCancel: () => void;
}

export default function AddItemForm({ onAdd, onCancel }: AddItemFormProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(
        title,
        notes || undefined,
        deadline ? new Date(deadline) : undefined
      );
      setTitle("");
      setNotes("");
      setDeadline("");
    }
  };

  const handleCancel = () => {
    setTitle("");
    setNotes("");
    setDeadline("");
    onCancel();
  };

  return (
    <div className={styles.addItemForm}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.addItemTitle}
        placeholder="New item title"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={styles.addItemNotes}
        placeholder="Add notes (optional)"
        rows={2}
      />
      <div className={styles.addItemDeadline}>
        <IoCalendarOutline size={18} />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={styles.addItemDeadlineInput}
        />
      </div>
      <div className={styles.addItemActions}>
        <button onClick={handleAdd} className={styles.addItemSave}>
          Add Item
        </button>
        <button onClick={handleCancel} className={styles.addItemCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
