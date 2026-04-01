"use client";

import styles from "./goalModals.module.css";
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
        <div className={styles.aiSuggestWrapper}>
          <button
            type="button"
            className={styles.aiSuggestButton}
            onClick={onGenerateSuggestion}
            disabled={isLoading || disabled}
          >
            {isLoading ? "Generating..." : "AI Suggest"}
          </button>
          {disabled && <span className={styles.aiSuggestTooltip}>Enter a goal title first</span>}
        </div>
      </div>
      <div className={styles.inputWithSuggestion}>
        <textarea
          className={styles.fieldTextarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={SMART_PLACEHOLDERS[field]}
          rows={2}
          maxLength={1000}
        />
        {value.length > 800 && (
          <span className={value.length >= 1000 ? styles.charCountWarning : styles.charCount}>
            {value.length}/1000
          </span>
        )}
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
