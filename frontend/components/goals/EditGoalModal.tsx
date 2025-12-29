/**
 * EditGoalModal Component
 *
 * Modal for editing an existing goal with SMART goal framework and AI suggestions.
 *
 * Parent: GoalsContainer
 * Children: None (form component with AI integration)
 *
 * Props:
 * - goal: The goal object to edit (null if not editing)
 * - isOpen: Whether the modal is currently open
 * - onClose: Callback to close the modal
 * - onSave: Callback to save the updated goal
 *
 * Features:
 * - Pink-to-purple gradient title (reverse of AddGoalModal)
 * - Pre-populated fields from existing goal
 * - Displays creation date in subtitle
 * - SMART goal fields with AI suggestions
 * - Form validation (title required)
 */

"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/goals/goalModals.module.css";
import { GoalWithDetails } from "@/services/goalService";
import { IoClose, IoSparkles } from "react-icons/io5";
import { generateSmartGoalSuggestion } from "@/services/aiGoalService";

interface EditGoalModalProps {
  goal: GoalFull | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: GoalFull) => Promise<void>;
}

export default function EditGoalModal({
  goal,
  isOpen,
  onClose,
  onSave,
}: EditGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [attainable, setAttainable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [timely, setTimely] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (goal && isOpen) {
      setTitle(goal.title || "");
      setDescription(goal.description || "");
      setTargetDate(goal.targetDate || "");
      setSpecific(goal.specific || "");
      setMeasurable(goal.measurable || "");
      setAttainable(goal.attainable || "");
      setRelevant(goal.relevant || "");
      setTimely(goal.timely || "");
      setSuggestions({});
    }
  }, [goal, isOpen]);

  const handleGenerateSuggestion = async (
    field: "specific" | "measurable" | "attainable" | "relevant" | "timely"
  ) => {
    if (!title.trim()) {
      alert("Please enter a goal title first to generate AI suggestions");
      return;
    }

    setLoadingSuggestion(field);
    try {
      const suggestion = await generateSmartGoalSuggestion(field, title, description);
      setSuggestions((prev) => ({ ...prev, [field]: suggestion }));
    } catch (error) {
      console.error("Failed to generate suggestion:", error);
    } finally {
      setLoadingSuggestion(null);
    }
  };

  const handleUseSuggestion = (field: string, suggestion: string) => {
    switch (field) {
      case "specific":
        setSpecific(suggestion);
        break;
      case "measurable":
        setMeasurable(suggestion);
        break;
      case "attainable":
        setAttainable(suggestion);
        break;
      case "relevant":
        setRelevant(suggestion);
        break;
      case "timely":
        setTimely(suggestion);
        break;
    }
    setSuggestions((prev) => {
      const newSuggestions = { ...prev };
      delete newSuggestions[field];
      return newSuggestions;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goal) return;

    if (!title.trim()) {
      alert("Goal title is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...goal,
        title,
        description,
        targetDate,
        specific,
        measurable,
        attainable,
        relevant,
        timely,
      });
    } catch (error) {
      console.error("Failed to update goal:", error);
      alert("Failed to update goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !goal) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <div>
              <h2 className={`${styles.modalTitle} ${styles.editModalTitle}`}>Edit Goal</h2>
              <p className={styles.modalSubtitle}>
                Created on {goal.createdAt}
              </p>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
            >
              <IoClose />
            </button>
          </div>

          <div className={styles.modalBody}>
            {/* Basic Information */}
            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>Basic Information</span>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your goal title"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Description</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your goal in detail"
                  rows={3}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Target Date</label>
                <input
                  type="date"
                  className={styles.fieldInput}
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>

            {/* SMART Goals */}
            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>SMART Goals Framework</span>
              <p className={styles.sectionDescription}>
                Use AI to help refine your specific, measurable, attainable,
                relevant, and timely goals
              </p>

              {/* Specific */}
              <div className={styles.fieldGroup}>
                <div className={styles.labelWithButton}>
                  <label className={styles.fieldLabel}>Specific</label>
                  <button
                    type="button"
                    className={styles.aiSuggestButton}
                    onClick={() => handleGenerateSuggestion("specific")}
                    disabled={loadingSuggestion === "specific" || !title.trim()}
                  >
                    <IoSparkles size={14} />
                    {loadingSuggestion === "specific" ? "Generating..." : "AI Suggest"}
                  </button>
                </div>
                <div className={styles.inputWithSuggestion}>
                  <textarea
                    className={styles.fieldTextarea}
                    value={specific}
                    onChange={(e) => setSpecific(e.target.value)}
                    placeholder="What exactly do you want to accomplish?"
                    rows={2}
                  />
                  {suggestions.specific && (
                    <div className={styles.suggestionBox}>
                      <p className={styles.suggestionText}>{suggestions.specific}</p>
                      <button
                        type="button"
                        className={styles.useSuggestionButton}
                        onClick={() =>
                          handleUseSuggestion("specific", suggestions.specific)
                        }
                      >
                        Use this suggestion
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Measurable */}
              <div className={styles.fieldGroup}>
                <div className={styles.labelWithButton}>
                  <label className={styles.fieldLabel}>Measurable</label>
                  <button
                    type="button"
                    className={styles.aiSuggestButton}
                    onClick={() => handleGenerateSuggestion("measurable")}
                    disabled={loadingSuggestion === "measurable" || !title.trim()}
                  >
                    <IoSparkles size={14} />
                    {loadingSuggestion === "measurable"
                      ? "Generating..."
                      : "AI Suggest"}
                  </button>
                </div>
                <div className={styles.inputWithSuggestion}>
                  <textarea
                    className={styles.fieldTextarea}
                    value={measurable}
                    onChange={(e) => setMeasurable(e.target.value)}
                    placeholder="How will you measure your progress?"
                    rows={2}
                  />
                  {suggestions.measurable && (
                    <div className={styles.suggestionBox}>
                      <p className={styles.suggestionText}>{suggestions.measurable}</p>
                      <button
                        type="button"
                        className={styles.useSuggestionButton}
                        onClick={() =>
                          handleUseSuggestion("measurable", suggestions.measurable)
                        }
                      >
                        Use this suggestion
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Attainable */}
              <div className={styles.fieldGroup}>
                <div className={styles.labelWithButton}>
                  <label className={styles.fieldLabel}>Attainable</label>
                  <button
                    type="button"
                    className={styles.aiSuggestButton}
                    onClick={() => handleGenerateSuggestion("attainable")}
                    disabled={loadingSuggestion === "attainable" || !title.trim()}
                  >
                    <IoSparkles size={14} />
                    {loadingSuggestion === "attainable"
                      ? "Generating..."
                      : "AI Suggest"}
                  </button>
                </div>
                <div className={styles.inputWithSuggestion}>
                  <textarea
                    className={styles.fieldTextarea}
                    value={attainable}
                    onChange={(e) => setAttainable(e.target.value)}
                    placeholder="How will you achieve this goal?"
                    rows={2}
                  />
                  {suggestions.attainable && (
                    <div className={styles.suggestionBox}>
                      <p className={styles.suggestionText}>{suggestions.attainable}</p>
                      <button
                        type="button"
                        className={styles.useSuggestionButton}
                        onClick={() =>
                          handleUseSuggestion("attainable", suggestions.attainable)
                        }
                      >
                        Use this suggestion
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Relevant */}
              <div className={styles.fieldGroup}>
                <div className={styles.labelWithButton}>
                  <label className={styles.fieldLabel}>Relevant</label>
                  <button
                    type="button"
                    className={styles.aiSuggestButton}
                    onClick={() => handleGenerateSuggestion("relevant")}
                    disabled={loadingSuggestion === "relevant" || !title.trim()}
                  >
                    <IoSparkles size={14} />
                    {loadingSuggestion === "relevant" ? "Generating..." : "AI Suggest"}
                  </button>
                </div>
                <div className={styles.inputWithSuggestion}>
                  <textarea
                    className={styles.fieldTextarea}
                    value={relevant}
                    onChange={(e) => setRelevant(e.target.value)}
                    placeholder="Why is this goal important to you?"
                    rows={2}
                  />
                  {suggestions.relevant && (
                    <div className={styles.suggestionBox}>
                      <p className={styles.suggestionText}>{suggestions.relevant}</p>
                      <button
                        type="button"
                        className={styles.useSuggestionButton}
                        onClick={() =>
                          handleUseSuggestion("relevant", suggestions.relevant)
                        }
                      >
                        Use this suggestion
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Timely */}
              <div className={styles.fieldGroup}>
                <div className={styles.labelWithButton}>
                  <label className={styles.fieldLabel}>Timely</label>
                  <button
                    type="button"
                    className={styles.aiSuggestButton}
                    onClick={() => handleGenerateSuggestion("timely")}
                    disabled={loadingSuggestion === "timely" || !title.trim()}
                  >
                    <IoSparkles size={14} />
                    {loadingSuggestion === "timely" ? "Generating..." : "AI Suggest"}
                  </button>
                </div>
                <div className={styles.inputWithSuggestion}>
                  <textarea
                    className={styles.fieldTextarea}
                    value={timely}
                    onChange={(e) => setTimely(e.target.value)}
                    placeholder="When will you complete this goal?"
                    rows={2}
                  />
                  {suggestions.timely && (
                    <div className={styles.suggestionBox}>
                      <p className={styles.suggestionText}>{suggestions.timely}</p>
                      <button
                        type="button"
                        className={styles.useSuggestionButton}
                        onClick={() =>
                          handleUseSuggestion("timely", suggestions.timely)
                        }
                      >
                        Use this suggestion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
