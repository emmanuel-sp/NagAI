/** AgentOverview Component - Displays agent status and information. Parent: AgentBuilderContainer */
"use client";
import { Agent } from "@/types/agent";
import styles from "@/styles/agent/agent-builder.module.css";

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
            agent.isDeployed ? styles.statusDeployed : styles.statusDraft
          }`}
        >
          {agent.isDeployed ? "✓ Deployed" : "● Draft"}
        </span>
      </div>

      <div className={styles.overviewContent}>
        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Active Contexts</span>
          <span className={styles.statValue}>{agent.contexts.length}</span>
        </div>

        {agent.deployedAt && (
          <div className={styles.overviewStat}>
            <span className={styles.statLabel}>Deployed</span>
            <span className={styles.statValue}>
              {agent.deployedAt.toLocaleDateString()}
            </span>
          </div>
        )}

        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Last Updated</span>
          <span className={styles.statValue}>
            {agent.lastUpdatedAt.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
