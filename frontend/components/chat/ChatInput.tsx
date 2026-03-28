"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import styles from "./chat.module.css";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "30px";
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
    el.style.height = "30px";
    const scrollH = el.scrollHeight;
    const clamped = Math.min(scrollH, 120);
    el.style.height = clamped + "px";
    el.style.overflowY = scrollH > 120 ? "auto" : "hidden";
  }, []);

  return (
    <div className={styles.inputArea}>
      <div className={styles.inputPill}>
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
    </div>
  );
}
