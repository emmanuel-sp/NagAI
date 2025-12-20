import React from "react";
import { Goal } from "@/types/chat";
import styles from "@/styles/chat.module.css";

interface Props {
  goals: Goal[];
  selectedGoalIds: string[];
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (goalIds: string[]) => void;
}

const GoalSelector: React.FC<Props> = ({
  goals,
  selectedGoalIds,
  isExpanded,
  onToggle,
  onChange,
}) => {
  const handleToggleGoal = (goalId: string) => {
    if (selectedGoalIds.includes(goalId)) {
      onChange(selectedGoalIds.filter((id) => id !== goalId));
    } else {
      onChange([...selectedGoalIds, goalId]);
    }
  };

  return (
    <div>
      <button
        className={`${styles.goalSelectorToggle} ${
          isExpanded ? styles.active : ""
        }`}
        onClick={onToggle}
        type="button"
      >
        {isExpanded ? "Hide Goals" : "Select Goals"}
      </button>
      <div
        className={`${styles.goalExpansionSection} ${
          isExpanded ? styles.expanded : ""
        }`}
      >
        {isExpanded && (
          <>
            <span className={styles.goalSelectLabel}>Goal Context</span>
            <div className={styles.goalSelectGrid}>
              {goals.map((goal) => (
                <label key={goal.id} className={styles.goalCheckboxItem}>
                  <input
                    type="checkbox"
                    checked={selectedGoalIds.includes(goal.id)}
                    onChange={() => handleToggleGoal(goal.id)}
                  />
                  {goal.name || goal.title}
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoalSelector;
