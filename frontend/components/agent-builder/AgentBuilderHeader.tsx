/** AgentBuilderHeader Component - Header for Agent Builder page. Parent: AgentBuilderContainer */
"use client";
import styles from "@/styles/agent/agent-builder.module.css";

export default function AgentBuilderHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Agent Builder</h1>
      <p className={styles.subtitle}>
        Create and configure your personal AI agent to help you stay on track with your goals
      </p>
    </header>
  );
}
