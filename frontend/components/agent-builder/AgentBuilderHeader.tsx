/** AgentBuilderHeader Component - Header for Agent Builder page. Parent: AgentBuilderContainer */
"use client";
import styles from "@/styles/agent/agent-builder.module.css";

export default function AgentBuilderHeader() {
  return (
    <div className={styles.agentHeader}>
      <h1 className={styles.agentTitle}>Agent Builder</h1>
      <p className={styles.agentSubtitle}>Configure your AI agent and knowledge base</p>
    </div>
  );
}
