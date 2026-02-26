"use client";

import { IoSparkles } from "react-icons/io5";
import styles from "@/styles/goals/goalModals.module.css";
import { SmartField } from "@/hooks/useSmartGoalForm";

const SMART_PLACEHOLDERS: Record<SmartField, string> = {
  specific: "What exactly do you want to accomplish?",
  measurable: "How will you measure your progress?",
  attainable: "How will you achieve this goal?",
  relevant: "Why is this goal important to you?",
  timely: "When will you complete this goal?",
};

interface SmartFieldGroupProps {
  field: SmartField;
  value: string;
  onChange: (value: string) => void;
  suggestion?: string;
  isLoading: boolean;
  disabled: boolean;
  onGenerateSuggestion: () => void;
  onUseSuggestion: () => void;
}

export default function SmartFieldGroup({
  field,
  value,
  onChange,
  suggestion,
  isLoading,
  disabled,
  onGenerateSuggestion,
  onUseSuggestion,
}: SmartFieldGroupProps) {
  const label = field.charAt(0).toUpperCase() + field.slice(1);

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.labelWithButton}>
        <label className={styles.fieldLabel}>{label}</label>
        <button
          type="button"
          className={styles.aiSuggestButton}
          onClick={onGenerateSuggestion}
          disabled={isLoading || disabled}
        >
          <IoSparkles size={14} />
          {isLoading ? "Generating..." : "AI Suggest"}
        </button>
      </div>
      <div className={styles.inputWithSuggestion}>
        <textarea
          className={styles.fieldTextarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={SMART_PLACEHOLDERS[field]}
          rows={2}
        />
        {suggestion && (
          <div className={styles.suggestionBox}>
            <p className={styles.suggestionText}>{suggestion}</p>
            <button
              type="button"
              className={styles.useSuggestionButton}
              onClick={onUseSuggestion}
            >
              Use this suggestion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
