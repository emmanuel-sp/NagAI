"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AgentContext } from "@/types/agent";
import styles from "./chat.module.css";

interface ContextPickerProps {
  contexts: AgentContext[];
  selectedContextId: number | null;
  onSelect: (contextId: number | null) => void;
}

export default function ContextPicker({
  contexts,
  selectedContextId,
  onSelect,
}: ContextPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = contexts.find((c) => c.contextId === selectedContextId);

  const handleSelect = useCallback(
    (contextId: number | null) => {
      onSelect(contextId);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <div className={styles.contextPicker} ref={ref}>
      <button
        className={`${styles.contextPickerBtn} ${selected ? styles.contextPickerBtnActive : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.contextPickerLabel}>
          {selected ? selected.name : "Context"}
        </span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
      </button>

      {open && (
        <div className={styles.contextPickerMenu}>
          <button
            className={`${styles.contextPickerItem} ${!selectedContextId ? styles.contextPickerItemActive : ""}`}
            onClick={() => handleSelect(null)}
          >
            None
          </button>
          {contexts.map((ctx) => (
            <button
              key={ctx.contextId}
              className={`${styles.contextPickerItem} ${ctx.contextId === selectedContextId ? styles.contextPickerItemActive : ""}`}
              onClick={() => handleSelect(ctx.contextId)}
            >
              <span className={styles.contextPickerItemName}>{ctx.name}</span>
              <span className={styles.contextPickerItemType}>{ctx.messageType}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
