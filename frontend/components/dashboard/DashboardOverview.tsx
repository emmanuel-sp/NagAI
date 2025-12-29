/**
 * DashboardOverview - Overview cards for goals, checklists, digests, and agent
 */
"use client";

import Link from "next/link";
import { Goal } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import { Digest } from "@/types/digest";
import { Agent } from "@/types/agent";
import {
  IoFlagOutline,
  IoListOutline,
  IoDocumentText,
  IoConstruct,
  IoArrowForward,
  IoCheckmarkCircle,
  IoTimeOutline
} from "react-icons/io5";
import styles from "@/styles/pages/dashboard.module.css";

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

  const formatDate = (date?: Date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={styles.overviewGrid}>
      {/* Goals Card */}
      <Link href="/goals" className={styles.overviewCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <IoFlagOutline size={32} />
          </div>
          <h3 className={styles.cardTitle}>Goals</h3>
        </div>
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Goals</span>
            <span className={styles.statValue}>{goals.length}</span>
          </div>
        </div>
        {goals.length > 0 && (
          <div className={styles.cardInfo}>
            <p className={styles.infoText}>
              {goals.length} {goals.length === 1 ? "goal" : "goals"} to work towards
            </p>
          </div>
        )}
        <div className={styles.cardFooter}>
          <span>View all goals</span>
          <IoArrowForward size={18} />
        </div>
      </Link>

      {/* Checklists Card */}
      <Link href="/checklists" className={styles.overviewCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <IoListOutline size={32} />
          </div>
          <h3 className={styles.cardTitle}>Checklists</h3>
        </div>
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Lists</span>
            <span className={styles.statValue}>{checklists.length}</span>
          </div>
        </div>
        {totalChecklistItems > 0 && (
          <>
            <div className={styles.cardInfo}>
              <div className={styles.infoRow}>
                <IoCheckmarkCircle size={18} />
                <span>
                  {completedChecklistItems} of {totalChecklistItems} items completed ({completionPercentage}%)
                </span>
              </div>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </>
        )}
        <div className={styles.cardFooter}>
          <span>Manage checklists</span>
          <IoArrowForward size={18} />
        </div>
      </Link>

      {/* Digest Card */}
      <Link href="/digests" className={styles.overviewCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <IoDocumentText size={32} />
          </div>
          <h3 className={styles.cardTitle}>Digest</h3>
        </div>
        {digest ? (
          <>
            <div className={styles.cardStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statValue}>
                  {digest.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.infoRow}>
                <IoCheckmarkCircle size={18} />
                <span>Delivery: {digest.frequency}, {digest.deliveryTime}</span>
              </div>
              {digest.isActive && digest.nextDeliveryAt && (
                <div className={styles.infoRow}>
                  <IoTimeOutline size={18} />
                  <span>Next: {formatDate(digest.nextDeliveryAt)}</span>
                </div>
              )}
            </div>
            <div className={styles.cardFooter}>
              <span>Configure digest</span>
              <IoArrowForward size={18} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.cardInfo}>
              <p className={styles.emptyText}>No digest configured yet</p>
            </div>
            <div className={styles.cardFooter}>
              <span>Set up digest</span>
              <IoArrowForward size={18} />
            </div>
          </>
        )}
      </Link>

      {/* Agent Card */}
      <Link href="/agent" className={styles.overviewCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <IoConstruct size={32} />
          </div>
          <h3 className={styles.cardTitle}>AI Agent</h3>
        </div>
        {agent ? (
          <>
            <div className={styles.cardStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statValue}>
                  {agent.isDeployed ? "Deployed" : "Draft"}
                </span>
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.infoRow}>
                <IoCheckmarkCircle size={18} />
                <span>
                  {agent.contexts.length} context{agent.contexts.length !== 1 ? "s" : ""} configured
                </span>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <span>Manage agent</span>
              <IoArrowForward size={18} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.cardInfo}>
              <p className={styles.emptyText}>No agent configured yet</p>
            </div>
            <div className={styles.cardFooter}>
              <span>Build agent</span>
              <IoArrowForward size={18} />
            </div>
          </>
        )}
      </Link>
    </div>
  );
}
