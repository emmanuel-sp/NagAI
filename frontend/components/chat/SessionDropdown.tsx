"use client";

import { useState, useRef, useEffect } from "react";
import { ChatSession } from "@/types/chat";
import styles from "./chat.module.css";

interface SessionDropdownProps {
  sessions: ChatSession[];
  activeSessionId: number | null;
  onSelect: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
  onNewChat: () => void;
}

export default function SessionDropdown({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onNewChat,
}: SessionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);
  const label = activeSession?.title || "New conversation";

  return (
    <div className={styles.sessionDropdown} ref={ref}>
      <button
        className={styles.sessionButton}
        onClick={() => setOpen(!open)}
      >
        <svg
          className={styles.sessionIcon}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <span className={styles.sessionButtonText}>{label}</span>
        <span
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
        />
      </button>

      {open && (
        <div className={styles.dropdownMenu}>
          <button
            className={`${styles.dropdownItem} ${styles.dropdownItemNew} ${
              !activeSessionId ? styles.dropdownItemActive : ""
            }`}
            onClick={() => {
              onNewChat();
              setOpen(false);
            }}
          >
            New conversation
          </button>

          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className={`${styles.dropdownItem} ${
                session.sessionId === activeSessionId
                  ? styles.dropdownItemActive
                  : ""
              }`}
              onClick={() => {
                onSelect(session.sessionId);
                setOpen(false);
              }}
            >
              <span className={styles.dropdownItemTitle}>
                {session.title || "Untitled"}
              </span>
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.sessionId);
                }}
                title="Delete conversation"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
