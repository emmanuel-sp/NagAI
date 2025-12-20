import { GoalDetails } from "./Goal";
import { Goal } from "./Goal";
import styles from "@/styles/goals/goalsList.module.css";

interface GoalsListProps {
  goals: GoalDetails[];
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
