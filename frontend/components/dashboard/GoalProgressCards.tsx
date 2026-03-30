"use client";

import Link from "next/link";
import { Goal } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import styles from "./dashboard.module.css";

interface GoalProgressCardsProps {
  goals: Goal[];
  checklists: Checklist[];
}

export default function GoalProgressCards({ goals, checklists }: GoalProgressCardsProps) {
  if (goals.length === 0) {
    return (
      <div className={styles.goalCardsSection}>
        <span className={styles.sectionHeading}>Your Goals</span>
        <Link href="/goals" className={styles.goalCardCta}>
          <span className={styles.goalCardCtaText}>Create your first goal</span>
          <span className={styles.goalCardCtaArrow}>&rarr;</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.goalCardsSection}>
      <span className={styles.sectionHeading}>Your Goals</span>
      <div className={styles.goalCardsGrid}>
        {goals.map((goal) => {
          const checklist = checklists.find((c) => c.goalId === goal.goalId);
          const totalItems = checklist?.items.length ?? 0;
          const completedItems = checklist?.items.filter((i) => i.completed).length ?? 0;
          const progressPct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
          const nextItem = checklist?.items
            .filter((i) => !i.completed)
            .sort((a, b) => a.sortOrder - b.sortOrder)[0];

          return (
            <Link
              key={goal.goalId}
              href={`/goals/${goal.goalId}`}
              className={styles.goalCard}
            >
              <span className={styles.goalCardTitle}>{goal.title}</span>

              {totalItems > 0 ? (
                <>
                  <div className={styles.goalCardProgressRow}>
                    <div className={styles.goalCardProgressTrack}>
                      <div
                        className={styles.goalCardProgressFill}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className={styles.goalCardProgressText}>
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                  <span className={styles.goalCardNextItem}>
                    {nextItem ? nextItem.title : "All done"}
                  </span>
                </>
              ) : (
                <span className={styles.goalCardNextItem}>No checklist items yet</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
