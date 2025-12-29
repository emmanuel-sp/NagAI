import styles from "@/styles/goals/goalCard.module.css";
import { Goal as GoalType } from "@/types/goal";

interface GoalProps extends GoalType {
    onView?: (id: string) => void;
}

export function Goal({ title, description, createdAt, targetDate, id, onView }: GoalProps) {
    return (
        <div className={styles.goalCard}>
            <div className={styles.goalHeader}>
                <h3 className={styles.goalTitle}>{title}</h3>
            </div>
            <p className={styles.goalDescription}>{description}</p>
            <div className={styles.goalMeta}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created</span>
                    <span className={styles.metaValue}>{createdAt}</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Target Date</span>
                    <span className={styles.metaValue}>{targetDate}</span>
                </div>
            </div>
            <div className={styles.goalActions}>
                <button
                    className={styles.viewButton}
                    onClick={() => onView?.(id)}
                >
                    View Details
                </button>
            </div>
        </div>
    );
}