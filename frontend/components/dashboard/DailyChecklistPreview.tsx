"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DailyChecklist } from "@/types/dailyChecklist";
import { fetchTodayChecklist } from "@/services/dailyChecklistService";
import { IoCheckmarkCircle, IoEllipseOutline, IoChevronRight } from "@/components/icons";
import styles from "./dashboard.module.css";

const PREVIEW_COUNT = 4;

export default function DailyChecklistPreview() {
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayChecklist()
      .then(setChecklist)
      .catch(() => setChecklist(null))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = checklist?.items.filter((i) => i.completed).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const preview = checklist?.items.slice(0, PREVIEW_COUNT) ?? [];

  return (
    <Link href="/today" className={styles.dailyPreviewCard}>
      <div className={styles.dailyPreviewHeader}>
        <div className={styles.dailyPreviewMeta}>
          <span className={styles.dailyPreviewLabel}>Daily Plan</span>
          {!loading && checklist && (
            <span className={styles.dailyPreviewCount}>
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <span className={styles.dailyPreviewArrow}>
          <IoChevronRight size={15} />
        </span>
      </div>

      {loading ? (
        <div className={styles.dailyPreviewLoading}>
          <div className={styles.dailyPreviewSkeletonBar} />
          <div className={styles.dailyPreviewSkeletonBar} style={{ width: "70%" }} />
          <div className={styles.dailyPreviewSkeletonBar} style={{ width: "85%" }} />
        </div>
      ) : !checklist ? (
        <p className={styles.dailyPreviewEmpty}>
          No plan yet — tap to plan your day
        </p>
      ) : (
        <>
          {totalCount > 0 && (
            <div className={styles.dailyPreviewProgress}>
              <div className={styles.dailyPreviewProgressBar}>
                <div
                  className={styles.dailyPreviewProgressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <ul className={styles.dailyPreviewList}>
            {preview.map((item) => (
              <li
                key={item.dailyItemId}
                className={`${styles.dailyPreviewItem} ${item.completed ? styles.dailyPreviewItemDone : ""}`}
              >
                <span className={`${styles.dailyPreviewCheck} ${item.completed ? styles.dailyPreviewCheckDone : ""}`}>
                  {item.completed ? (
                    <IoCheckmarkCircle size={14} />
                  ) : (
                    <IoEllipseOutline size={14} />
                  )}
                </span>
                <span className={styles.dailyPreviewItemTitle}>{item.title}</span>
              </li>
            ))}
            {totalCount > PREVIEW_COUNT && (
              <li className={styles.dailyPreviewMore}>
                +{totalCount - PREVIEW_COUNT} more
              </li>
            )}
          </ul>
        </>
      )}
    </Link>
  );
}
