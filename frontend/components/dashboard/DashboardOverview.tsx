/**
 * DashboardOverview - Overview sections for goals, checklists, digests, and agent
 */
"use client";

import Link from "next/link";
import { Goal } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import { Digest } from "@/types/digest";
import { Agent } from "@/types/agent";
import styles from "./dashboard.module.css";

interface DashboardOverviewProps {
  goals: Goal[];
  checklists: Checklist[];
  digest: Digest | null;
  agent: Agent | null;
}

export default function DashboardOverview({
  goals,
  checklists,
  digest,
  agent,
}: DashboardOverviewProps) {
  const totalChecklistItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
  const completedChecklistItems = checklists.reduce(
    (sum, c) => sum + c.items.filter((i) => i.completed).length,
    0
  );

  const completionPercentage = totalChecklistItems > 0
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
    : 0;

  return (
    <div className={styles.overview}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        <Link href="/goals" className={styles.statBlock}>
          <span className={styles.statNumber}>{goals.length}</span>
          <span className={styles.statName}>Goals</span>
        </Link>
        <Link href="/checklists" className={styles.statBlock}>
          <span className={styles.statNumber}>{checklists.length}</span>
          <span className={styles.statName}>Checklists</span>
        </Link>
        <div className={styles.statBlock}>
          <span className={styles.statNumber}>{completionPercentage}%</span>
          <span className={styles.statName}>Complete</span>
        </div>
      </div>

      {/* Progress bar */}
      {totalChecklistItems > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Checklist progress</span>
            <span className={styles.progressValue}>
              {completedChecklistItems}/{totalChecklistItems} items
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className={styles.quickLinks}>
        <Link href="/goals" className={styles.quickLink}>
          <div className={styles.quickLinkContent}>
            <span className={styles.quickLinkTitle}>Goals</span>
            <span className={styles.quickLinkMeta}>
              {goals.length > 0
                ? `${goals.length} active`
                : "Get started"}
            </span>
          </div>
          <span className={styles.quickLinkArrow}>&rarr;</span>
        </Link>

        <Link href="/checklists" className={styles.quickLink}>
          <div className={styles.quickLinkContent}>
            <span className={styles.quickLinkTitle}>Checklists</span>
            <span className={styles.quickLinkMeta}>
              {checklists.length > 0
                ? `${completedChecklistItems} of ${totalChecklistItems} done`
                : "Create your first"}
            </span>
          </div>
          <span className={styles.quickLinkArrow}>&rarr;</span>
        </Link>

        <Link href="/digests" className={styles.quickLink}>
          <div className={styles.quickLinkContent}>
            <span className={styles.quickLinkTitle}>Digest</span>
            <span className={styles.quickLinkMeta}>
              {digest
                ? `${digest.active ? "Active" : "Paused"} · ${digest.frequency}`
                : "Not configured"}
            </span>
          </div>
          <span className={styles.quickLinkArrow}>&rarr;</span>
        </Link>

        <Link href="/agent" className={styles.quickLink}>
          <div className={styles.quickLinkContent}>
            <span className={styles.quickLinkTitle}>AI Agent</span>
            <span className={styles.quickLinkMeta}>
              {agent
                ? `${agent.deployed ? "Deployed" : "Draft"} · ${agent.contexts.length} contexts`
                : "Not configured"}
            </span>
          </div>
          <span className={styles.quickLinkArrow}>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
