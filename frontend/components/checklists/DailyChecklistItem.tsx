"use client";

import { DailyChecklistItem as DailyChecklistItemType } from "@/types/dailyChecklist";
import { IoTrash, IoClock, IoCheckmarkCircle, IoEllipseOutline } from "@/components/icons";
import styles from "./dailyChecklist.module.css";

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

interface DailyChecklistItemProps {
  item: DailyChecklistItemType;
  onToggle: (dailyItemId: number) => void;
  onDelete: (dailyItemId: number) => void;
}

export default function DailyChecklistItem({
  item,
  onToggle,
  onDelete,
}: DailyChecklistItemProps) {
  return (
    <div
      className={`${styles.item} ${item.completed ? styles.itemCompleted : ""}`}
    >
      <button
        className={`${styles.itemCheckbox} ${item.completed ? styles.checkboxChecked : styles.checkboxUnchecked}`}
        onClick={() => onToggle(item.dailyItemId)}
        aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
      >
        {item.completed ? (
          <IoCheckmarkCircle size={20} />
        ) : (
          <IoEllipseOutline size={20} />
        )}
      </button>

      <div className={styles.itemContent}>
        <span className={styles.itemTitle}>{item.title}</span>
        {item.notes && (
          <span className={styles.itemNotes}>{item.notes}</span>
        )}
        <div className={styles.itemMeta}>
          {item.scheduledTime && (
            <span className={styles.timeBadge}>
              <IoClock size={12} />
              {formatTime12h(item.scheduledTime)}
            </span>
          )}
          {item.parentGoalTitle && (
            <span className={styles.goalPill}>{item.parentGoalTitle}</span>
          )}
        </div>
      </div>

      <div className={styles.itemActions}>
        <button
          className={styles.itemActionDelete}
          onClick={() => onDelete(item.dailyItemId)}
          aria-label="Remove item"
        >
          <IoTrash size={14} />
        </button>
      </div>
    </div>
  );
}
