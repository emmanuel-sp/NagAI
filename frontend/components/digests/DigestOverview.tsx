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
  const frequencyLabels = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Every two weeks",
    monthly: "Monthly",
  } as const;

  const deliveryLabels = {
    morning: "Morning delivery",
    afternoon: "Afternoon delivery",
    evening: "Evening delivery",
  } as const;

  const statusLabel = digest.active
    ? "Active"
    : digest.pauseReason === "stale_progress"
      ? "Paused for inactivity"
      : "Inactive";

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
    <section className={styles.overviewCard}>
      <div className={styles.overviewHeader}>
        <div className={styles.overviewIntro}>
          <span className={styles.pageEyebrow}>Digest</span>
          <p className={styles.pageDescription}>
            {digest.description || "Personalized guidance delivered on your cadence."}
          </p>
        </div>
        {headerAction ? <div className={styles.overviewHeaderAction}>{headerAction}</div> : null}
      </div>

      <div className={styles.overviewMeta}>
        <div className={styles.overviewMetaItem}>
          <span className={styles.overviewMetaLabel}>Cadence</span>
          <span className={styles.overviewMetaValue}>
            {frequencyLabels[digest.frequency]} · {deliveryLabels[digest.deliveryTime]}
          </span>
        </div>

        <div className={styles.overviewMetaItem}>
          <span className={styles.overviewMetaLabel}>Content Mix</span>
          <span className={styles.overviewMetaValue}>
            {digest.contentTypes.length} selected {digest.contentTypes.length === 1 ? "section" : "sections"}
          </span>
        </div>

        <div className={styles.overviewMetaItem}>
          <span className={styles.overviewMetaLabel}>Status</span>
          <span className={styles.overviewMetaValue}>{statusLabel}</span>
        </div>
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
    </section>
  );
}
