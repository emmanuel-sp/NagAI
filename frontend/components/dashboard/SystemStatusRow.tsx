"use client";

import Link from "next/link";
import { Digest } from "@/types/digest";
import { parseUtcDate } from "@/lib/dates";
import styles from "./dashboard.module.css";

interface SystemStatusRowProps {
  digest: Digest | null;
}

function formatNextDelivery(nextDeliveryAt: string): string {
  const date = parseUtcDate(nextDeliveryAt);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SystemStatusRow({ digest }: SystemStatusRowProps) {
  const digestLabel = digest
    ? digest.active
      ? `Active \u00b7 next ${digest.nextDeliveryAt ? formatNextDelivery(digest.nextDeliveryAt) : digest.frequency}`
      : "Paused"
    : "Not set up";

  return (
    <div className={styles.systemStatusRow}>
      <Link href="/digests" className={styles.statusPill}>
        <span className={styles.statusPillLabel}>Digest</span>
        <span className={styles.statusPillValue}>{digestLabel}</span>
      </Link>
    </div>
  );
}
