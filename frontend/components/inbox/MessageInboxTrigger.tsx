"use client";

import { useState } from "react";
import { IoBell } from "@/components/icons";
import MessageInboxPanel from "./MessageInboxPanel";
import styles from "./MessageInboxTrigger.module.css";

interface MessageInboxTriggerProps {
  variant?: "nav" | "icon";
  className?: string;
  label?: string;
  title?: string;
  ariaLabel?: string;
}

export default function MessageInboxTrigger({
  variant = "nav",
  className = "",
  label = "Messages",
  title = "Messages",
  ariaLabel = "Open message inbox",
}: MessageInboxTriggerProps) {
  const [inboxOpen, setInboxOpen] = useState(false);
  const isIconOnly = variant === "icon";

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger} ${isIconOnly ? styles.iconOnly : styles.nav} ${className}`.trim()}
        onClick={() => setInboxOpen(true)}
        aria-label={ariaLabel}
        title={title}
      >
        <IoBell size={15} />
        {!isIconOnly && <span className={styles.label}>{label}</span>}
      </button>

      <MessageInboxPanel isOpen={inboxOpen} onClose={() => setInboxOpen(false)} />
    </>
  );
}
