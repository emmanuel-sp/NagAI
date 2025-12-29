/** DigestOverview Component - Shows digest status and statistics */
"use client";

import { Digest } from "@/types/digest";
import styles from "@/styles/digests/digest-builder.module.css";

interface DigestOverviewProps {
  digest: Digest;
}

export default function DigestOverview({ digest }: DigestOverviewProps) {
  const formatDate = (date?: Date) => {
    if (!date) return "Not yet";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.overviewCard}>
      <div className={styles.overviewHeader}>
        <h2 className={styles.cardTitle}>Digest Overview</h2>
        <span
          className={`${styles.statusBadge} ${
            digest.isActive ? styles.statusActive : styles.statusInactive
          }`}
        >
          {digest.isActive ? "● Active" : "● Inactive"}
        </span>
      </div>

      <div className={styles.overviewContent}>
        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Frequency</span>
          <span className={styles.statValue}>
            {digest.frequency.charAt(0).toUpperCase() + digest.frequency.slice(1)}
          </span>
        </div>

        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Content Types</span>
          <span className={styles.statValue}>{digest.contentTypes.length}</span>
        </div>

        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Last Delivered</span>
          <span className={styles.statValue}>
            {formatDate(digest.lastDeliveredAt)}
            {digest.lastDeliveredAt && (
              <span className={styles.statTime}>
                {" "}at {formatTime(digest.lastDeliveredAt)}
              </span>
            )}
          </span>
        </div>

        <div className={styles.overviewStat}>
          <span className={styles.statLabel}>Next Delivery</span>
          <span className={styles.statValue}>
            {formatDate(digest.nextDeliveryAt)}
            {digest.nextDeliveryAt && (
              <span className={styles.statTime}>
                {" "}at {formatTime(digest.nextDeliveryAt)}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
