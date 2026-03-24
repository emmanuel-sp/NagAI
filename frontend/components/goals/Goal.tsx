import styles from "./goalCard.module.css";
import { Goal as GoalType } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import { parseUtcDate } from "@/lib/dates";

interface GoalProps extends GoalType {
    checklist?: Checklist;
    onView?: (goalId: number) => void;
}

const formatDate = (dateStr: string) =>
    parseUtcDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function Goal({ title, description, createdAt, targetDate, goalId, checklist, onView }: GoalProps) {
    const totalItems = checklist?.items.length ?? 0;
    const completedItems = checklist?.items.filter((i) => i.completed).length ?? 0;
    const progressPct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const nextItem = checklist?.items
        .filter((i) => !i.completed)
        .sort((a, b) => a.sortOrder - b.sortOrder)[0];

    return (
        <div className={styles.goalCard}>
            <div className={styles.goalHeader}>
                <h3 className={styles.goalTitle}>{title}</h3>
            </div>
            <p className={styles.goalDescription}>{description}</p>

            {totalItems > 0 && (
                <div className={styles.goalProgress}>
                    <div className={styles.progressRow}>
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className={styles.progressText}>
                            {completedItems}/{totalItems}
                        </span>
                    </div>
                    <span className={styles.nextItem}>
                        {nextItem ? nextItem.title : "All items completed"}
                    </span>
                </div>
            )}

            <div className={styles.goalMeta}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created</span>
                    <span className={styles.metaValue}>{formatDate(createdAt)}</span>
                </div>
                {
                targetDate &&
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Target Date</span>
                    <span className={styles.metaValue}>{formatDate(targetDate)}</span>
                </div>
                }
            </div>
            <div className={styles.goalActions}>
                <button
                    className={styles.viewButton}
                    onClick={() => onView?.(goalId)}
                >
                    View Details
                </button>
            </div>
        </div>
    );
}
