"use client";

import { useState, useEffect } from "react";
import styles from "./goalModals.module.css";
import { GoalWithDetails } from "@/types/goal";
import { IoClose, IoTrash } from "@/components/icons";
import { useModal } from "@/contexts/ModalContext";
import { useSmartGoalForm, SmartField } from "@/hooks/useSmartGoalForm";
import SmartFieldGroup from "@/components/goals/SmartFieldGroup";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const SMART_FIELDS: SmartField[] = ["specific", "measurable", "attainable", "relevant", "timely"];

interface GoalFormModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateModeProps extends GoalFormModalBaseProps {
  mode: "create";
  onSubmit: (goal: {
    title: string;
    description: string;
    targetDate: string;
    specific: string;
    measurable: string;
    attainable: string;
    relevant: string;
    timely: string;
    stepsTaken: string;
  }) => Promise<void>;
}

interface EditModeProps extends GoalFormModalBaseProps {
  mode: "edit";
  goal: GoalWithDetails;
  onSubmit: (goal: GoalWithDetails) => Promise<void>;
  onRemove?: (goalId: number) => Promise<void>;
}

type GoalFormModalProps = CreateModeProps | EditModeProps;

export default function GoalFormModal(props: GoalFormModalProps) {
  const { isOpen, onClose, mode } = props;
  const { fields, setField, resetFields, loadingSuggestion, suggestions, suggestionError, generateSuggestion, useSuggestion } =
    useSmartGoalForm();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { registerModal } = useModal();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      registerModal(true);
    }
    return () => {
      document.body.style.overflow = "";
      registerModal(false);
    };
  }, [isOpen, registerModal]);

  useEffect(() => {
    if (!isOpen) {
      resetFields();
      return;
    }
    if (mode === "edit") {
      const { goal } = props as EditModeProps;
      resetFields({
        title: goal.title || "",
        description: goal.description || "",
        targetDate: goal.targetDate || "",
        specific: goal.specific || "",
        measurable: goal.measurable || "",
        attainable: goal.attainable || "",
        relevant: goal.relevant || "",
        timely: goal.timely || "",
        stepsTaken: goal.stepsTaken || "",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.title.trim()) {
      setFormError("Goal title is required");
      return;
    }

    setFormError(null);
    setIsSaving(true);
    try {
      if (mode === "create") {
        await (props as CreateModeProps).onSubmit(fields);
        resetFields();
      } else {
        const { goal } = props as EditModeProps;
        await (props as EditModeProps).onSubmit({ ...goal, ...fields });
      }
    } catch (error) {
      console.error(`Failed to ${mode} goal:`, error);
      setFormError(`Failed to ${mode === "create" ? "create" : "update"} goal. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGoal = async () => {
    if (mode !== "edit") return;
    const { goal, onRemove } = props as EditModeProps;
    if (!onRemove) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await onRemove(goal.goalId);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to remove goal:", error);
      setDeleteError("Failed to remove goal. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (mode === "create") {
      const hasChanges = fields.title || fields.description || fields.specific || fields.measurable || fields.attainable || fields.relevant || fields.timely || fields.stepsTaken;
      if (hasChanges) {
        setShowCloseConfirm(true);
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;
  if (mode === "edit" && !(props as EditModeProps).goal) return null;

  const isCreate = mode === "create";

  return (
    <div className={styles.modalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className={styles.modalContent}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <div>
              <h2 className={styles.modalTitle}>
                {isCreate ? "Create New Goal" : "Edit Goal"}
              </h2>
              {!isCreate && (
                <p className={styles.modalSubtitle}>
                  Created on {new Date((props as EditModeProps).goal.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
            <button type="button" className={styles.closeButton} onClick={handleClose}>
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
                  autoFocus={isCreate}
                  maxLength={200}
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
                  maxLength={1000}
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

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Steps Already Taken</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={fields.stepsTaken}
                  onChange={(e) => setField("stepsTaken", e.target.value)}
                  placeholder="Describe any progress or steps you've already taken toward this goal"
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>SMART Goals Framework</span>
              <p className={styles.sectionDescription}>
                Use AI to help {isCreate ? "you create" : "refine your"} specific, measurable, attainable, relevant, and timely goals
              </p>

              {suggestionError && <p className={styles.deleteError}>{suggestionError}</p>}

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

          {formError && <div className={styles.formError}>{formError}</div>}

          <div className={styles.modalFooter}>
            {!isCreate && (props as EditModeProps).onRemove && (
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
            <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className={isCreate ? styles.createButton : styles.saveButton}
              disabled={isSaving || !fields.title.trim()}
            >
              {isSaving
                ? (isCreate ? "Creating..." : "Saving...")
                : (isCreate ? "Create Goal" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>

      {isCreate && (
        <ConfirmDialog
          isOpen={showCloseConfirm}
          title="Unsaved Changes"
          message="You have unsaved changes. Are you sure you want to close?"
          confirmLabel="Discard"
          destructive
          onConfirm={() => { setShowCloseConfirm(false); onClose(); }}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}

      {!isCreate && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Remove Goal"
          message={`Are you sure you want to remove "${fields.title}"? This action cannot be undone.`}
          confirmLabel={isDeleting ? "Removing..." : "Yes, Remove"}
          destructive
          loading={isDeleting}
          onConfirm={handleRemoveGoal}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {deleteError && !showDeleteConfirm && <p className={styles.deleteError}>{deleteError}</p>}
    </div>
  );
}
