import { Goal as GoalType } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import { Goal as GoalCard } from "./Goal";
import styles from "./goalsList.module.css";

interface GoalsListProps {
  goals: GoalType[];
  checklists: Checklist[];
  onViewGoal: (goalId: number) => void;
}

export default function GoalsList({ goals, checklists, onViewGoal }: GoalsListProps) {
  return (
    <ul className={styles.goalsList}>
      {goals.map((goal) => {
        const checklist = checklists.find((c) => c.goalId === goal.goalId);
        return (
          <li key={goal.goalId}>
            <GoalCard {...goal} checklist={checklist} onView={onViewGoal} />
          </li>
        );
      })}
    </ul>
  );
}
