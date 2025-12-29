import { Goal as GoalType } from "@/types/goal";
import { Goal as GoalCard } from "./Goal";
import styles from "@/styles/goals/goalsList.module.css";

interface GoalsListProps {
  goals: GoalType[];
  onViewGoal: (id: string) => void;
}

export default function GoalsList({ goals, onViewGoal }: GoalsListProps) {
  return (
    <ul className={styles.goalsList}>
      {goals.map((goal) => (
        <li key={goal.id}>
          <GoalCard {...goal} onView={onViewGoal} />
        </li>
      ))}
    </ul>
  );
}
