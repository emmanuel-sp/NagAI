"use client";

import { useState } from "react";
import { IoCheck } from "@/components/icons";
import styles from "./OnboardingWizard.module.css";

interface SuggestionChipsProps {
  suggestions: string[];
  selected: string[];
  onToggle: (item: string) => void;
  onRemove: (index: number) => void;
  onAdd: (item: string) => void;
  placeholder?: string;
  maxItems?: number;
}

export default function SuggestionChips({
  suggestions,
  selected,
  onToggle,
  onRemove,
  onAdd,
  placeholder = "Add your own...",
  maxItems,
}: SuggestionChipsProps) {
  const [customValue, setCustomValue] = useState("");
  const atLimit = maxItems != null && selected.length >= maxItems;

  const handleAdd = () => {
    if (atLimit) return;
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onAdd(trimmed);
      setCustomValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleToggle = (item: string) => {
    // Allow deselecting even at limit
    if (atLimit && !selected.includes(item)) return;
    onToggle(item);
  };

  return (
    <div>
      {selected.length > 0 && (
        <div className={styles.selectedItems}>
          {selected.map((item, i) => (
            <span key={item} className={styles.selectedItem}>
              {item}
              <button
                type="button"
                className={styles.removeItem}
                onClick={() => onRemove(i)}
                aria-label={`Remove ${item}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={styles.chipGrid}>
        {suggestions.map((suggestion) => {
          const isSelected = selected.includes(suggestion);
          const disabled = atLimit && !isSelected;
          return (
            <button
              key={suggestion}
              type="button"
              className={`${styles.chip} ${isSelected ? styles.chipSelected : ""}`}
              onClick={() => handleToggle(suggestion)}
              disabled={disabled}
              style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
            >
              {isSelected && <span className={styles.chipCheck}><IoCheck size={11} /></span>}
              {suggestion}
            </button>
          );
        })}
      </div>

      <div className={styles.customInputRow}>
        <input
          type="text"
          className={styles.customInput}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={atLimit ? `Limit of ${maxItems} reached` : placeholder}
          disabled={atLimit}
        />
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAdd}
          disabled={atLimit}
          style={atLimit ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
        >
          Add
        </button>
      </div>

      {maxItems != null && (
        <div className={styles.limitMessage}>
          {selected.length} / {maxItems} selected
        </div>
      )}
    </div>
  );
}
