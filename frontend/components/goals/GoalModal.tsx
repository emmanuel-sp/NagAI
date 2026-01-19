"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/goals/goalModals.module.css";
import { GoalWithDetails } from "@/types/goal";
import { IoClose, IoTrash } from "react-icons/io5";

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
}

function EditableField({ label, value, onSave, multiline = false }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{label}</label>
        <div className={styles.fieldValue}>
          {value || "(empty)"}
          <button
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldInputContainer}>
        {multiline ? (
          <textarea
            className={styles.fieldTextarea}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            autoFocus
          />
        ) : (
          <input
            className={styles.fieldInput}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            autoFocus
          />
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <button className={styles.saveButton} onClick={handleSave}>
            Save
          </button>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface GoalModalProps {
  goal: GoalWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (goal: GoalWithDetails) => Promise<void>;
  onRemove?: (goalId: number) => Promise<void>;
}

export default function GoalModal({ goal, isOpen, onClose, onSave, onRemove }: GoalModalProps) {
  const [editedGoal, setEditedGoal] = useState<GoalWithDetails | null>(goal);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    // If goal is null, create a new empty goal template
    if (goal === null && isOpen) {
      return; // Error here
    } else {
      setEditedGoal(goal);
    }
  }, [goal, isOpen]);

  if (!isOpen) {
    return null;
  }

  if (!editedGoal) {
    return null;
  }

  const handleFieldSave = async (field: keyof GoalWithDetails, value: string) => {
    const updated = { ...editedGoal, [field]: value };
    setEditedGoal(updated);

    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(updated);
      } catch (error) {
        console.error("Failed to save goal:", error);
        setEditedGoal(goal);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemoveGoal = async () => {
    if (!editedGoal || !onRemove) return;

    setIsDeleting(true);
    try {
      await onRemove(editedGoal.goalId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to remove goal:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{editedGoal.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Basic Information */}
          <div className={styles.formSection}>
            <span className={styles.sectionTitle}>Basic Information</span>
            <EditableField
              label="Title"
              value={editedGoal.title}
              onSave={(value) => handleFieldSave("title", value)}
            />
            <EditableField
              label="Description"
              value={editedGoal.description}
              onSave={(value) => handleFieldSave("description", value)}
              multiline
            />
          </div>

          {/* SMART Goals */}
          <div className={styles.formSection}>
            <span className={styles.sectionTitle}>SMART Goals</span>
            <EditableField
              label="Specific"
              value={editedGoal.specific || ""}
              onSave={(value) => handleFieldSave("specific", value)}
              multiline
            />
            <EditableField
              label="Measurable"
              value={editedGoal.measurable || ""}
              onSave={(value) => handleFieldSave("measurable", value)}
              multiline
            />
            <EditableField
              label="Attainable"
              value={editedGoal.attainable || ""}
              onSave={(value) => handleFieldSave("attainable", value)}
              multiline
            />
            <EditableField
              label="Relevant"
              value={editedGoal.relevant || ""}
              onSave={(value) => handleFieldSave("relevant", value)}
              multiline
            />
            <EditableField
              label="Timely"
              value={editedGoal.timely || ""}
              onSave={(value) => handleFieldSave("timely", value)}
              multiline
            />
          </div>

          {/* Timeline */}
          <div className={styles.formSection}>
            <span className={styles.sectionTitle}>Timeline</span>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Created Date</label>
              <div className={styles.fieldValue} style={{ cursor: "default" }}>
                {editedGoal.createdAt}
              </div>
            </div>
            <EditableField
              label="Target Date"
              value={editedGoal.targetDate}
              onSave={(value) => handleFieldSave("targetDate", value)}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          {onRemove && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
            >
              <IoTrash size={16} />
              Remove Goal
            </button>
          )}
          <button className={styles.cancelButton} onClick={onClose} disabled={isSaving}>
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Remove Goal</h3>
            <p className={styles.confirmMessage}>
              Are you sure you want to remove &quot;{editedGoal?.title}&quot;? This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleRemoveGoal}
                disabled={isDeleting}
              >
                {isDeleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
