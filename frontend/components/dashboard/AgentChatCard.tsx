"use client";

import Link from "next/link";
import styles from "./dashboard.module.css";

export default function AgentChatCard() {
  return (
    <Link href="/chat" className={styles.agentChatCard}>
      <div className={styles.agentChatGlow} aria-hidden />
      <div className={styles.agentChatIcon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C6.477 2 2 6.154 2 11.278c0 2.636 1.13 5.01 2.947 6.737L4 22l4.335-1.78A10.6 10.6 0 0 0 12 20.556c5.523 0 10-4.154 10-9.278S17.523 2 12 2Z"
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="11" r="1" fill="currentColor" />
          <circle cx="12" cy="11" r="1" fill="currentColor" />
          <circle cx="15.5" cy="11" r="1" fill="currentColor" />
        </svg>
      </div>
      <div className={styles.agentChatBody}>
        <span className={styles.agentChatLabel}>AI Chat</span>
        <p className={styles.agentChatTitle}>Talk to your agent</p>
        <p className={styles.agentChatSub}>Ask questions, get coaching, and take action on your goals</p>
      </div>
      <div className={styles.agentChatArrow} aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </div>
    </Link>
  );
}
