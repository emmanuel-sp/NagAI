"use client";

import { useState } from "react";
import {
  DailyChecklistConfig as ConfigType,
  UpdateDailyChecklistConfigDto,
} from "@/types/dailyChecklist";
import { Goal } from "@/types/goal";
import { IoClose } from "@/components/icons";
import styles from "./dailyChecklist.module.css";

interface DailyChecklistConfigProps {
  config: ConfigType;
  goals: Goal[];
  onSave: (data: UpdateDailyChecklistConfigDto) => Promise<void>;
}

function arraysEqual(a: number[] | null, b: number[] | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export default function DailyChecklistConfig({
  config,
  goals,
  onSave,
}: DailyChecklistConfigProps) {
  const [maxItems, setMaxItems] = useState(config.maxItems);
  const [recurringItems, setRecurringItems] = useState<string[]>(
    config.recurringItems ?? []
  );
  const [selectedGoalIds, setSelectedGoalIds] = useState<number[] | null>(
    config.includedGoalIds
  );
  const [newRecurring, setNewRecurring] = useState("");
  const [saving, setSaving] = useState(false);

  const initialRecurring = config.recurringItems ?? [];
  const isDirty =
    maxItems !== config.maxItems ||
    recurringItems.length !== initialRecurring.length ||
    recurringItems.some((item, i) => item !== initialRecurring[i]) ||
    !arraysEqual(selectedGoalIds, config.includedGoalIds);

  const addRecurring = () => {
    const trimmed = newRecurring.trim();
    if (!trimmed || recurringItems.includes(trimmed)) return;
    setRecurringItems([...recurringItems, trimmed]);
    setNewRecurring("");
  };

  const removeRecurring = (index: number) => {
    setRecurringItems(recurringItems.filter((_, i) => i !== index));
  };

  const toggleGoal = (goalId: number) => {
    if (selectedGoalIds === null) {
      setSelectedGoalIds(
        goals.filter((g) => g.goalId !== goalId).map((g) => g.goalId)
      );
    } else if (selectedGoalIds.includes(goalId)) {
      const updated = selectedGoalIds.filter((id) => id !== goalId);
      setSelectedGoalIds(updated.length === 0 ? null : updated);
    } else {
      const updated = [...selectedGoalIds, goalId];
      setSelectedGoalIds(updated.length === goals.length ? null : updated);
    }
  };

  const isGoalSelected = (goalId: number) =>
    selectedGoalIds === null || selectedGoalIds.includes(goalId);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        maxItems,
        recurringItems,
        includedGoalIds: selectedGoalIds,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.configPanel}>
      <div className={styles.configSection}>
        <label className={styles.configLabel}>Max items per day</label>
        <input
          type="number"
          min={1}
          max={12}
          value={maxItems}
          onChange={(e) =>
            setMaxItems(Math.max(1, Math.min(12, Number(e.target.value))))
          }
          className={styles.configInput}
        />
      </div>

      <div className={styles.configSection}>
        <label className={styles.configLabel}>Recurring anchors</label>
        <div className={styles.anchorWrap}>
          {recurringItems.map((item, i) => (
            <span key={i} className={styles.anchorChip}>
              {item}
              <button
                onClick={() => removeRecurring(i)}
                className={styles.anchorChipRemove}
                aria-label={`Remove ${item}`}
              >
                <IoClose size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newRecurring}
            onChange={(e) => setNewRecurring(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addRecurring(); }
            }}
            placeholder={recurringItems.length === 0 ? "e.g. Morning run, Take medication" : "Add another..."}
            className={styles.anchorInput}
            maxLength={200}
          />
        </div>
      </div>

      <div className={styles.configSection}>
        <label className={styles.configLabel}>Goals to consider</label>
        {goals.length > 0 ? (
          <div className={styles.goalPills}>
            {goals.map((goal) => {
              const selected = isGoalSelected(goal.goalId);
              return (
                <button
                  key={goal.goalId}
                  type="button"
                  className={`${styles.goalPillToggle} ${selected ? styles.goalPillToggleActive : ""}`}
                  onClick={() => toggleGoal(goal.goalId)}
                >
                  {goal.title}
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.configHint}>No goals created yet.</p>
        )}
      </div>

      {isDirty && (
        <div className={styles.configFooter}>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
