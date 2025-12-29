"use client";

import { useState } from "react";
import { ChecklistItem as ChecklistItemType } from "@/types/checklist";
import styles from "@/styles/checklists/checklist.module.css";
import {
  IoCheckmarkCircle,
  IoEllipseOutline,
  IoTrash,
  IoPencil,
  IoSave,
  IoClose,
  IoCalendarOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (itemId: string) => void;
  onUpdate: (
    itemId: string,
    updates: { title?: string; notes?: string; deadline?: Date }
  ) => void;
  onDelete: (itemId: string) => void;
}

export default function ChecklistItem({
  item,
  onToggle,
  onUpdate,
  onDelete,
}: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editNotes, setEditNotes] = useState(item.notes || "");
  const [editDeadline, setEditDeadline] = useState(
    item.deadline ? item.deadline.toISOString().split("T")[0] : ""
  );

  const handleSave = () => {
    onUpdate(item.id, {
      title: editTitle,
      notes: editNotes || undefined,
      deadline: editDeadline ? new Date(editDeadline) : undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditNotes(item.notes || "");
    setEditDeadline(
      item.deadline ? item.deadline.toISOString().split("T")[0] : ""
    );
    setIsEditing(false);
  };

  const isOverdue =
    item.deadline &&
    !item.completed &&
    new Date(item.deadline) < new Date();

  const formatDeadline = (date: Date) => {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isEditing) {
    return (
      <div className={`${styles.checklistItem} ${styles.checklistItemEditing}`}>
        <div className={styles.itemEditForm}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={styles.itemEditTitle}
            placeholder="Item title"
            autoFocus
          />
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className={styles.itemEditNotes}
            placeholder="Add notes (optional)"
            rows={2}
          />
          <div className={styles.itemEditDeadline}>
            <IoCalendarOutline size={18} />
            <input
              type="date"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              className={styles.itemEditDeadlineInput}
            />
          </div>
          <div className={styles.itemEditActions}>
            <button onClick={handleSave} className={styles.itemEditSave}>
              <IoSave size={18} />
              Save
            </button>
            <button onClick={handleCancel} className={styles.itemEditCancel}>
              <IoClose size={18} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.checklistItem} ${
        item.completed ? styles.checklistItemCompleted : ""
      } ${isOverdue ? styles.checklistItemOverdue : ""}`}
    >
      <button
        onClick={() => onToggle(item.id)}
        className={styles.itemCheckbox}
        aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {item.completed ? (
          <IoCheckmarkCircle size={24} className={styles.checkboxChecked} />
        ) : (
          <IoEllipseOutline size={24} className={styles.checkboxUnchecked} />
        )}
      </button>

      <div className={styles.itemContent}>
        <div className={styles.itemTitle}>{item.title}</div>
        {item.notes && (
          <div className={styles.itemNotes}>
            <IoDocumentTextOutline size={14} />
            {item.notes}
          </div>
        )}
        {item.deadline && (
          <div
            className={`${styles.itemDeadline} ${
              isOverdue ? styles.itemDeadlineOverdue : ""
            }`}
          >
            <IoCalendarOutline size={14} />
            {formatDeadline(item.deadline)}
            {isOverdue && <span className={styles.overdueLabel}>Overdue</span>}
          </div>
        )}
        {item.completedAt && (
          <div className={styles.itemCompletedAt}>
            Completed on {formatDeadline(item.completedAt)}
          </div>
        )}
      </div>

      <div className={styles.itemActions}>
        <button
          onClick={() => setIsEditing(true)}
          className={styles.itemActionButton}
          aria-label="Edit item"
        >
          <IoPencil size={18} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className={`${styles.itemActionButton} ${styles.itemActionDelete}`}
          aria-label="Delete item"
        >
          <IoTrash size={18} />
        </button>
      </div>
    </div>
  );
}
