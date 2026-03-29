"use client";

import { useState } from "react";
import { ActionSuggestion, QuizParams } from "@/types/chat";
import styles from "./QuizCard.module.css";

interface QuizCardProps {
  suggestion: ActionSuggestion;
  onSelect: (answer: string) => void;
  disabled: boolean;
}

function parseQuizParams(raw: string | Record<string, unknown>): QuizParams {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  // Normalize options: AI might return strings instead of {label} objects
  const rawOptions = Array.isArray(parsed.options) ? parsed.options : [];
  const options = rawOptions.map((opt: unknown) =>
    typeof opt === "string" ? { label: opt } : (opt as { label: string; description?: string })
  );
  return {
    question: parsed.question || "",
    options,
    allowFreeResponse: parsed.allowFreeResponse ?? true,
    freeResponsePlaceholder: parsed.freeResponsePlaceholder,
  };
}

export default function QuizCard({ suggestion, onSelect, disabled }: QuizCardProps) {
  const [freeText, setFreeText] = useState("");
  const params = parseQuizParams(suggestion.paramsJson);
  const isAnswered = suggestion.status === "accepted";

  const handleOptionClick = (label: string) => {
    if (isAnswered || disabled) return;
    onSelect(label);
  };

  const handleFreeSubmit = () => {
    if (!freeText.trim() || isAnswered || disabled) return;
    onSelect(freeText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFreeSubmit();
    }
  };

  return (
    <div className={`${styles.card} ${isAnswered ? styles.cardAnswered : ""}`}>
      <div className={styles.question}>{params.question}</div>

      <div className={styles.options}>
        {params.options.map((opt, i) => (
          <button
            key={i}
            className={styles.optionChip}
            onClick={() => handleOptionClick(opt.label)}
            disabled={isAnswered || disabled}
          >
            <span className={styles.optionLabel}>{opt.label}</span>
            {opt.description && (
              <span className={styles.optionDesc}>{opt.description}</span>
            )}
          </button>
        ))}
      </div>

      {params.allowFreeResponse !== false && !isAnswered && (
        <div className={styles.freeResponse}>
          <input
            type="text"
            className={styles.freeInput}
            placeholder={params.freeResponsePlaceholder || "Or type your own..."}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
          {freeText.trim() && (
            <button
              className={styles.sendBtn}
              onClick={handleFreeSubmit}
              disabled={disabled}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {isAnswered && (
        <div className={styles.answeredBadge}>Answered</div>
      )}
    </div>
  );
}
