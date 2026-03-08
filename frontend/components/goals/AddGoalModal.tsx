"use client";

import { useState, useEffect } from "react";
import styles from "./goalModals.module.css";
import { IoClose } from "@/components/icons";
import { useModal } from "@/contexts/ModalContext";
import { useSmartGoalForm, SmartField } from "@/hooks/useSmartGoalForm";
import SmartFieldGroup from "@/components/goals/SmartFieldGroup";

const SMART_FIELDS: SmartField[] = ["specific", "measurable", "attainable", "relevant", "timely"];

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: {
    title: string;
    description: string;
    targetDate: string;
    specific: string;
    measurable: string;
    attainable: string;
    relevant: string;
    timely: string;
  }) => Promise<void>;
}

export default function AddGoalModal({ isOpen, onClose, onAdd }: AddGoalModalProps) {
  const { fields, setField, resetFields, loadingSuggestion, suggestions, suggestionError, generateSuggestion, useSuggestion } =
    useSmartGoalForm();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      await onAdd(fields);
      resetFields();
    } catch (error) {
      console.error("Failed to create goal:", error);
      setFormError("Failed to create goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    const hasChanges = fields.title || fields.description || fields.specific || fields.measurable || fields.attainable || fields.relevant || fields.timely;
    if (hasChanges && !confirm("You have unsaved changes. Are you sure you want to close?")) {
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <h2 className={`${styles.modalTitle} ${styles.addModalTitle}`}>Create New Goal</h2>
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
                  autoFocus
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
            </div>

            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>SMART Goals Framework</span>
              <p className={styles.sectionDescription}>
                Use AI to help you create specific, measurable, attainable, relevant, and timely goals
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
            <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton} disabled={isSaving || !fields.title.trim()}>
              {isSaving ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
