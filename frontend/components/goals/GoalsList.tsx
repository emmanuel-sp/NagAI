import { Goal } from "@/types/goal";
import { Goal } from "./Goal";
import styles from "@/styles/goals/goalsList.module.css";

interface GoalsListProps {
  goals: Goal[];
  onViewGoal: (id: string) => void;
}

export default function GoalsList({ goals, onViewGoal }: GoalsListProps) {
  return (
    <ul className={styles.goalsList}>
      {goals.map((goal) => (
        <li key={goal.id}>
          <Goal {...goal} onView={onViewGoal} />
        </li>
      ))}
    </ul>
  );
}
