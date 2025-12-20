/**
 * AddGoalModal Component
 *
 * Modal for creating a new goal with SMART goal framework and AI suggestions.
 *
 * Parent: GoalsContainer
 * Children: None (form component with AI integration)
 *
 * Props:
 * - isOpen: Whether the modal is currently open
 * - onClose: Callback to close the modal
 * - onAdd: Callback to add the new goal with all SMART goal fields
 *
 * Features:
 * - Purple-to-pink gradient title
 * - SMART goal fields (Specific, Measurable, Attainable, Relevant, Timely)
 * - AI-powered suggestions for each SMART field
 * - Form validation (title required)
 * - Unsaved changes warning
 */

"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/goals/goalModals.module.css";
import { IoClose, IoSparkles } from "react-icons/io5";
import { generateSmartGoalSuggestion } from "@/services/aiGoalService";

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
    // Clear the suggestion after using it
    setSuggestions((prev) => {
      const newSuggestions = { ...prev };
      delete newSuggestions[field];
      return newSuggestions;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Goal title is required");
      return;
    }

    setIsSaving(true);
    try {
      await onAdd({
        title,
        description,
        targetDate,
        specific,
        measurable,
        attainable,
        relevant,
        timely,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setTargetDate("");
      setSpecific("");
      setMeasurable("");
      setAttainable("");
      setRelevant("");
      setTimely("");
      setSuggestions({});
    } catch (error) {
      console.error("Failed to create goal:", error);
      alert("Failed to create goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (
      title ||
      description ||
      specific ||
      measurable ||
      attainable ||
      relevant ||
      timely
    ) {
      if (!confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <h2 className={`${styles.modalTitle} ${styles.addModalTitle}`}>Create New Goal</h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
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
                  autoFocus
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
                Use AI to help you create specific, measurable, attainable, relevant,
                and timely goals
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
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
