/** DigestStatusPanel Component - Activate/deactivate digest */
"use client";

import { Digest } from "@/types/digest";
import styles from "@/styles/digests/digest-builder.module.css";

interface DigestStatusPanelProps {
  digest: Digest;
  onToggleStatus: () => void;
}

export default function DigestStatusPanel({
  digest,
  onToggleStatus,
}: DigestStatusPanelProps) {
  return (
    <div className={styles.deploymentPanel}>
      <div className={styles.deploymentInfo}>
        <h2 className={styles.cardTitle}>
          {digest.isActive ? "Digest Active" : "Digest Inactive"}
        </h2>
        <p className={styles.cardSubtitle}>
          {digest.isActive
            ? "Your digest is currently active and will be delivered according to your schedule."
            : "Activate your digest to start receiving personalized content."}
        </p>
        {digest.isActive && digest.nextDeliveryAt && (
          <p className={styles.deploymentDate}>
            Next delivery:{" "}
            {new Date(digest.nextDeliveryAt).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {new Date(digest.nextDeliveryAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className={styles.deploymentActions}>
        <button
          onClick={onToggleStatus}
          className={digest.isActive ? styles.stopButton : styles.deployButton}
        >
          {digest.isActive ? "Deactivate Digest" : "Activate Digest"}
        </button>
      </div>
    </div>
  );
}
