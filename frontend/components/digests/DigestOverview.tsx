/** DigestOverview Component - Shows digest delivery timing */
"use client";

import { ReactNode } from "react";
import { Digest } from "@/types/digest";
import { parseUtcDate } from "@/lib/dates";
import styles from "./digest-builder.module.css";

interface DigestOverviewProps {
  digest: Digest;
  headerAction?: ReactNode;
}

export default function DigestOverview({ digest, headerAction }: DigestOverviewProps) {
  const formatDate = (date?: string) => {
    if (!date) return "Not yet";
    return parseUtcDate(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date?: string) => {
    if (!date) return "";
    return parseUtcDate(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.overviewCard}>
      <div className={styles.overviewHeader}>
        <div>
          <h2 className={styles.cardTitle}>Digest Overview</h2>
          <p className={styles.cardSubtitle}>
            Keep track of the last send and when the next digest is scheduled.
          </p>
        </div>
        {headerAction}
      </div>

      <div className={styles.overviewContent}>
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
