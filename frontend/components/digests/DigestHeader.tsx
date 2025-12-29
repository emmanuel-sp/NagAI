/** DigestHeader Component - Header for Digest Builder page */
"use client";

import styles from "@/styles/digests/digest-builder.module.css";

export default function DigestHeader() {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Digest Builder</h1>
      <p className={styles.subtitle}>
        Create personalized digests with insights, opportunities, and motivation delivered to you
      </p>
    </div>
  );
}
