/**
 * EditContextModal Component
 *
 * Modal for editing an existing agent context.
 * Parent: AgentBuilderContainer
 */

"use client";

import { useState, useEffect } from "react";
import { AgentContext, CreateContextRequest, MessageType, MessageFrequency } from "@/types/agent";
import { Goal } from "@/types/goal";
import { IoClose } from "react-icons/io5";
import styles from "@/styles/agent/agent-builder-modal.module.css";

interface EditContextModalProps {
  isOpen: boolean;
  context: AgentContext | null;
  goals: Goal[];
  onClose: () => void;
  onUpdate: (contextId: string, updates: CreateContextRequest) => void;
}

export default function EditContextModal({
  isOpen,
  context,
  goals,
  onClose,
  onUpdate,
}: EditContextModalProps) {
  const [name, setName] = useState("");
  const [goalId, setGoalId] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("motivation");
  const [messageFrequency, setMessageFrequency] = useState<MessageFrequency>("daily");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
    if (context) {
      setName(context.name);
      setGoalId(context.goalId);
      setMessageType(context.messageType);
      setMessageFrequency(context.messageFrequency);
      setCustomInstructions(context.customInstructions || "");
    }
  }, [context]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!context || !name.trim() || !goalId) {
      alert("Please provide a name and select a goal");
      return;
    }

    setIsSaving(true);
    try {
      const updates: CreateContextRequest = {
        name: name.trim(),
        goalId,
        messageType,
        messageFrequency,
        customInstructions: customInstructions.trim() || undefined,
      };

      await onUpdate(context.id, updates);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !context) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <div>
              <h2 className={styles.modalTitle}>Edit Context</h2>
              <p className={styles.modalSubtitle}>
                Update how your agent interacts with you about this goal
              </p>
            </div>
            <button type="button" onClick={onClose} className={styles.closeButton}>
              <IoClose />
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.formSection}>
            <label className={styles.formLabel}>
              Context Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              Goal <span className={styles.required}>*</span>
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className={styles.formSelect}
              required
            >
              <option value="">Select a goal...</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formSection}>
            <label className={styles.formLabel}>Primary Message Type</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input type="radio" value="nag" checked={messageType === "nag"} onChange={(e) => setMessageType(e.target.value as MessageType)} />
                <span className={styles.radioLabel}>
                  <span>Nag</span>
                  <span className={styles.radioDescription}>Persistent reminders</span>
                </span>
              </label>
              <label className={styles.radioOption}>
                <input type="radio" value="motivation" checked={messageType === "motivation"} onChange={(e) => setMessageType(e.target.value as MessageType)} />
                <span className={styles.radioLabel}>
                  <span>Motivation</span>
                  <span className={styles.radioDescription}>Encouraging messages</span>
                </span>
              </label>
              <label className={styles.radioOption}>
                <input type="radio" value="guidance" checked={messageType === "guidance"} onChange={(e) => setMessageType(e.target.value as MessageType)} />
                <span className={styles.radioLabel}>
                  <span>Guidance</span>
                  <span className={styles.radioDescription}>Strategic advice</span>
                </span>
              </label>
            </div>
          </div>

          <div className={styles.formSection}>
            <label className={styles.formLabel}>Message Frequency</label>
            <select value={messageFrequency} onChange={(e) => setMessageFrequency(e.target.value as MessageFrequency)} className={styles.formSelect}>
              <option value="daily">Daily</option>
              <option value="twice-daily">Twice Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
            </select>
          </div>

          <div className={styles.formSection}>
            <label className={styles.formLabel}>Custom Instructions (Optional)</label>
            <textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} className={styles.formTextarea} placeholder="Add any specific instructions..." rows={4} />
          </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
