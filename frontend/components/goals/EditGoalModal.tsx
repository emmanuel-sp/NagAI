"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/goals/goalModals.module.css";
import { GoalWithDetails } from "@/types/goal";
import { IoClose, IoTrash } from "react-icons/io5";
import { useSmartGoalForm, SmartField } from "@/hooks/useSmartGoalForm";
import SmartFieldGroup from "@/components/goals/SmartFieldGroup";

const SMART_FIELDS: SmartField[] = ["specific", "measurable", "attainable", "relevant", "timely"];

interface EditGoalModalProps {
  goal: GoalWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: GoalWithDetails) => Promise<void>;
  onRemove?: (goalId: number) => Promise<void>;
}

export default function EditGoalModal({ goal, isOpen, onClose, onSave, onRemove }: EditGoalModalProps) {
  const { fields, setField, resetFields, loadingSuggestion, suggestions, generateSuggestion, useSuggestion } =
    useSmartGoalForm();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (goal && isOpen) {
      resetFields({
        title: goal.title || "",
        description: goal.description || "",
        targetDate: goal.targetDate || "",
        specific: goal.specific || "",
        measurable: goal.measurable || "",
        attainable: goal.attainable || "",
        relevant: goal.relevant || "",
        timely: goal.timely || "",
      });
    }
  }, [goal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !fields.title.trim()) {
      alert("Goal title is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ ...goal, ...fields });
    } catch (error) {
      console.error("Failed to update goal:", error);
      alert("Failed to update goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGoal = async () => {
    if (!goal || !onRemove) return;
    setIsDeleting(true);
    try {
      await onRemove(goal.goalId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to remove goal:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !goal) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <div>
              <h2 className={`${styles.modalTitle} ${styles.editModalTitle}`}>Edit Goal</h2>
              <p className={styles.modalSubtitle}>Created on {goal.createdAt}</p>
            </div>
            <button type="button" className={styles.closeButton} onClick={onClose}>
              <IoClose />
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>Basic Information</span>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={fields.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Enter your goal title"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Description</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={fields.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe your goal in detail"
                  rows={3}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Target Date</label>
                <input
                  type="date"
                  className={styles.fieldInput}
                  value={fields.targetDate}
                  onChange={(e) => setField("targetDate", e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>SMART Goals Framework</span>
              <p className={styles.sectionDescription}>
                Use AI to help refine your specific, measurable, attainable, relevant, and timely goals
              </p>

              {SMART_FIELDS.map((field) => (
                <SmartFieldGroup
                  key={field}
                  field={field}
                  value={fields[field]}
                  onChange={(v) => setField(field, v)}
                  suggestion={suggestions[field]}
                  isLoading={loadingSuggestion === field}
                  disabled={!fields.title.trim()}
                  onGenerateSuggestion={() => generateSuggestion(field)}
                  onUseSuggestion={() => useSuggestion(field)}
                />
              ))}
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
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={isSaving || !fields.title.trim()}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Remove Goal</h3>
            <p className={styles.confirmMessage}>
              Are you sure you want to remove &quot;{fields.title}&quot;? This action cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelButton} onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className={styles.confirmDeleteButton} onClick={handleRemoveGoal} disabled={isDeleting}>
                {isDeleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
