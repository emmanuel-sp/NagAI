/** DigestStatusPanel Component - Activate/deactivate digest */
"use client";

import { Digest } from "@/types/digest";
import { parseUtcDate } from "@/lib/dates";
import styles from "./digest-builder.module.css";

interface DigestStatusPanelProps {
  digest: Digest;
  onToggleStatus: () => void;
}

export default function DigestStatusPanel({
  digest,
  onToggleStatus,
}: DigestStatusPanelProps) {
  const isPausedStale = !digest.active && digest.pauseReason === "stale_progress";
  const subtitle = digest.active
    ? "Your digest is live and following the cadence you set."
    : isPausedStale
      ? "Your digest is paused right now."
      : "Turn it on when you want personalized content arriving on schedule.";

  return (
    <div className={styles.deploymentPanel}>
      <div className={styles.deploymentInfo}>
        <h2 className={styles.cardTitle}>
          {digest.active
            ? "Digest Active"
            : isPausedStale
              ? "Digest Paused"
              : "Digest Inactive"}
        </h2>
        <p className={styles.cardSubtitle}>{subtitle}</p>
        {digest.active && digest.nextDeliveryAt && (
          <p className={styles.deploymentDate}>
            Next delivery:{" "}
            {parseUtcDate(digest.nextDeliveryAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {parseUtcDate(digest.nextDeliveryAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {isPausedStale && (
          <div className={styles.pauseBanner}>
            <p className={styles.pauseBannerTitle}>No progress detected</p>
            <p className={styles.pauseBannerText}>
              Your digest was paused because no checklist progress was made over
              several deliveries. Complete a task or reactivate to resume.
            </p>
          </div>
        )}
      </div>

      <div className={styles.deploymentActions}>
        <button
          type="button"
          onClick={onToggleStatus}
          disabled={!digest.active && !(digest.contentTypes?.length > 0)}
          className={digest.active ? styles.stopButton : styles.deployButton}
          title={!digest.active && !(digest.contentTypes?.length > 0) ? "Select at least one content type first" : undefined}
        >
          {digest.active
            ? "Deactivate Digest"
            : isPausedStale
              ? "Reactivate Digest"
              : "Activate Digest"}
        </button>
      </div>
    </div>
  );
}
