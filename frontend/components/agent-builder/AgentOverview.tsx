/** AgentOverview Component - Displays agent status and information. Parent: AgentBuilderContainer */
"use client";
import { Agent } from "@/types/agent";
import styles from "./agent-builder.module.css";

interface AgentOverviewProps {
  agent: Agent;
}

export default function AgentOverview({ agent }: AgentOverviewProps) {
  return (
    <div className={styles.overviewCard}>
      <div className={styles.overviewHeader}>
        <h2 className={styles.cardTitle}>Agent Overview</h2>
        <span
          className={`${styles.statusBadge} ${
            agent.deployed ? styles.statusDeployed : styles.statusDraft
          }`}
        >
          {agent.deployed ? "✓ Deployed" : "● Draft"}
        </span>
      </div>

      <div className={styles.overviewContent}>
        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Active Contexts</span>
          <span className={styles.statValue}>{agent.contexts.length}</span>
        </div>

        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Last Updated</span>
          <span className={styles.statValue}>
            {new Date(agent.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
