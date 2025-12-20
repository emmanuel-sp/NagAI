import { useRouter } from "next/navigation";
import styles from "@/styles/goals/goalCard.module.css";
import { IoListOutline } from "react-icons/io5";

export interface GoalDetails {
    title: string;
    description: string;
    createdAt: string;
    targetDate: string;
    id: string;
}

interface GoalProps extends GoalDetails {
    onView?: (id: string) => void;
}

export function Goal({ title, description, createdAt, targetDate, id, onView }: GoalProps) {
    const router = useRouter();

    const handleViewChecklist = () => {
        router.push(`/checklists?goalId=${id}`);
    };

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
                <button
                    className={styles.checklistButton}
                    onClick={handleViewChecklist}
                >
                    <IoListOutline size={18} />
                    Checklist
                </button>
            </div>
        </div>
    );
}