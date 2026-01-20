/** DigestHeader Component - Header for Digest Builder page */
"use client";

import styles from "@/styles/digests/digest-builder.module.css";

export default function DigestHeader() {
  return (
    <div className={styles.digestHeader}>
      <h1 className={styles.digestTitle}>Digest Builder</h1>
      <p className={styles.digestSubtitle}>Build personalized content summaries</p>
    </div>
  );
}
