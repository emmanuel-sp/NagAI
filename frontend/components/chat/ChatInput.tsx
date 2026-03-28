"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { AgentContext } from "@/types/agent";
import { Goal } from "@/types/goal";
import styles from "./chat.module.css";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  centered?: boolean;
  contexts: AgentContext[];
  goals: Goal[];
  selectedContextId: number | null;
  selectedGoalId: number | null;
  onSelectContext: (id: number | null) => void;
  onSelectGoal: (id: number | null) => void;
}

export default function ChatInput({
  onSend,
  disabled,
  centered,
  contexts,
  goals,
  selectedContextId,
  selectedGoalId,
  onSelectContext,
  onSelectGoal,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [plusOpen, setPlusOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
      textareaRef.current.style.overflowY = "hidden";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "36px";
    const scrollH = el.scrollHeight;
    const clamped = Math.min(scrollH, 140);
    el.style.height = clamped + "px";
    el.style.overflowY = scrollH > 140 ? "auto" : "hidden";
  }, []);

  // Close plus menu on outside click
  useEffect(() => {
    if (!plusOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
        setPlusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [plusOpen]);

  const handleSelectContext = useCallback(
    (id: number) => {
      if (selectedContextId === id) {
        onSelectContext(null);
      } else {
        onSelectContext(id);
        onSelectGoal(null);
      }
      setPlusOpen(false);
    },
    [selectedContextId, onSelectContext, onSelectGoal]
  );

  const handleSelectGoal = useCallback(
    (id: number) => {
      if (selectedGoalId === id) {
        onSelectGoal(null);
      } else {
        onSelectGoal(id);
        onSelectContext(null);
      }
      setPlusOpen(false);
    },
    [selectedGoalId, onSelectGoal, onSelectContext]
  );

  const selectedContext = contexts.find((c) => c.contextId === selectedContextId);
  const selectedGoal = goals.find((g) => g.goalId === selectedGoalId);
  const hasAttachment = !!selectedContext || !!selectedGoal;
  const hasMenuItems = contexts.length > 0 || goals.length > 0;

  return (
    <div className={`${styles.inputArea} ${centered ? styles.inputAreaCentered : ""}`}>
      {hasAttachment && (
        <div style={{ paddingLeft: 8, pointerEvents: "all" }}>
          <span className={styles.attachmentChip}>
            {selectedContext
              ? selectedContext.name
              : `Goal: ${selectedGoal?.title}`}
            <button
              className={styles.attachmentChipRemove}
              onClick={() => {
                if (selectedContext) onSelectContext(null);
                else onSelectGoal(null);
              }}
              aria-label="Remove attachment"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}
      <div className={styles.inputWrapper} ref={plusRef}>
        <div className={styles.inputPill}>
          {hasMenuItems && (
            <div className={styles.inputLeading}>
              <button
                className={`${styles.plusButton} ${plusOpen ? styles.plusButtonOpen : ""}`}
                onClick={() => setPlusOpen((v) => !v)}
                aria-label="Attach context or goal"
              >
                <svg
                  className={styles.plusIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          )}
          <div className={styles.inputPrimary}>
            <textarea
              ref={textareaRef}
              className={styles.chatTextarea}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleInput();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              rows={1}
              disabled={disabled}
            />
          </div>
          <div className={styles.inputTrailing}>
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              aria-label="Send message"
            >
              <svg
                className={styles.sendIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {plusOpen && (
          <div className={styles.plusMenu}>
            {contexts.length > 0 && (
              <div className={styles.plusMenuSection}>
                <div className={styles.plusMenuLabel}>Contexts</div>
                {contexts.map((ctx) => (
                  <button
                    key={ctx.contextId}
                    className={`${styles.plusMenuItem} ${ctx.contextId === selectedContextId ? styles.plusMenuItemActive : ""}`}
                    onClick={() => handleSelectContext(ctx.contextId)}
                  >
                    <svg className={styles.plusMenuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <span className={styles.plusMenuItemName}>{ctx.name}</span>
                    {ctx.contextId === selectedContextId && (
                      <svg className={styles.plusMenuItemCheck} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
            {goals.length > 0 && (
              <div className={styles.plusMenuSection}>
                <div className={styles.plusMenuLabel}>Goals</div>
                {goals.map((goal) => (
                  <button
                    key={goal.goalId}
                    className={`${styles.plusMenuItem} ${goal.goalId === selectedGoalId ? styles.plusMenuItemActive : ""}`}
                    onClick={() => handleSelectGoal(goal.goalId)}
                  >
                    <svg className={styles.plusMenuItemIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span className={styles.plusMenuItemName}>{goal.title}</span>
                    {goal.goalId === selectedGoalId && (
                      <svg className={styles.plusMenuItemCheck} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
