import React, { useState, FormEvent } from "react";
import { Goal } from "@/types/chat";
import styles from "@/styles/chat.module.css";
import { IoCheckmark, IoSend } from "react-icons/io5";

interface Props {
  onSend: (text: string, goalContext?: string[]) => void;
  disabled?: boolean;
  goals: Goal[];
}

const ChatInput: React.FC<Props> = ({ onSend, disabled = false, goals }) => {
  const [message, setMessage] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  const handleToggleGoal = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const goalContext = selectedGoalIds.length > 0 ? selectedGoalIds : undefined;
    onSend(trimmedMessage, goalContext);

    setMessage("");
  };

  return (
    <div className={styles.inputContainer}>
      {goals.length > 0 && (
        <div className={styles.goalSelectorBar}>
          <span className={styles.goalSelectorLabel}>Goal Context:</span>
          <div className={styles.goalChips}>
            {goals.map((goal) => {
              const isSelected = selectedGoalIds.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  className={`${styles.goalChip} ${
                    isSelected ? styles.goalChipSelected : ""
                  }`}
                  onClick={() => handleToggleGoal(goal.id)}
                  type="button"
                  disabled={disabled}
                >
                  {isSelected && <IoCheckmark className={styles.checkmark} />}
                  {goal.name || goal.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <form className={styles.inputField} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !message.trim()}>
          <IoSend style={{ fontSize: "18px" }} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
