/**
 * CreateContextModal Component
 *
 * Modal for creating a new agent context with all configuration options.
 * Parent: AgentBuilderContainer
 */

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CreateContextRequest, MessageType, MessageFrequency } from "@/types/agent";
import { Goal } from "@/types/goal";
import { IoClose } from "@/components/icons";
import { useModal } from "@/contexts/ModalContext";
import styles from "./agent-builder-modal.module.css";

interface CreateContextModalProps {
  isOpen: boolean;
  goals: Goal[];
  onClose: () => void;
  onCreate: (contextData: CreateContextRequest) => void;
}

export default function CreateContextModal({
  isOpen,
  goals,
  onClose,
  onCreate,
}: CreateContextModalProps) {
  const [name, setName] = useState("");
  const [goalId, setGoalId] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("motivation");
  const [messageFrequency, setMessageFrequency] = useState<MessageFrequency>("daily");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please provide a name");
      return;
    }

    setIsSaving(true);
    try {
      const contextData: CreateContextRequest = {
        name: name.trim(),
        goalId: goalId ? Number(goalId) : null,
        messageType,
        messageFrequency,
        customInstructions: customInstructions.trim() || undefined,
      };

      await onCreate(contextData);

      // Reset form
      setName("");
      setGoalId("");
      setMessageType("motivation");
      setMessageFrequency("daily");
      setCustomInstructions("");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <div>
              <h2 className={styles.modalTitle}>Create New Context</h2>
              <p className={styles.modalSubtitle}>
                Define how your agent will interact with you about a specific goal
              </p>
            </div>
            <button type="button" onClick={onClose} className={styles.closeButton}>
              <IoClose />
            </button>
          </div>

          <div className={styles.modalBody}>
          {/* Context Name */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              Context Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              placeholder="e.g., Morning Motivation, Weekly Check-in"
              required
              maxLength={100}
            />
          </div>

          {/* Goal Selection */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>Goal</label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className={styles.formSelect}
            >
              <option value="">Select a goal...</option>
              {goals.map((goal) => (
                <option key={goal.goalId} value={goal.goalId}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          {/* Message Type */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>Primary Message Type</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="nag"
                  checked={messageType === "nag"}
                  onChange={(e) => setMessageType(e.target.value as MessageType)}
                />
                <span className={styles.radioLabel}>
                  <span>Nag</span>
                  <span className={styles.radioDescription}>Persistent reminders</span>
                </span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="motivation"
                  checked={messageType === "motivation"}
                  onChange={(e) => setMessageType(e.target.value as MessageType)}
                />
                <span className={styles.radioLabel}>
                  <span>Motivation</span>
                  <span className={styles.radioDescription}>Encouraging messages</span>
                </span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="guidance"
                  checked={messageType === "guidance"}
                  onChange={(e) => setMessageType(e.target.value as MessageType)}
                />
                <span className={styles.radioLabel}>
                  <span>Guidance</span>
                  <span className={styles.radioDescription}>Strategic advice</span>
                </span>
              </label>
            </div>
          </div>

          {/* Message Frequency */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>Message Frequency</label>
            <select
              value={messageFrequency}
              onChange={(e) => setMessageFrequency(e.target.value as MessageFrequency)}
              className={styles.formSelect}
            >
              <option value="daily">Daily</option>
              <option value="twice-daily">Twice Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
            </select>
          </div>

          {/* Custom Instructions */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className={styles.formTextarea}
              placeholder="Add any specific instructions for how the agent should communicate about this goal..."
              rows={4}
              maxLength={2000}
            />
          </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={isSaving}
            >
              {isSaving ? "Creating..." : "Create Context"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
