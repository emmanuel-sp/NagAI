import SuggestionChips from "../SuggestionChips";
import styles from "../OnboardingWizard.module.css";

const SUGGESTIONS = [
  "Morning routine", "Daily exercise", "Reading 30 min/day", "Meditation",
  "Journaling", "Healthy eating", "8 hours sleep", "No social media before noon",
  "Weekly review", "Cold showers", "Gratitude practice", "Learning something new daily",
  "Stretching", "Drinking enough water", "Time blocking",
];

interface HabitsStepProps {
  items: string[];
  onToggle: (item: string) => void;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export default function HabitsStep({ items, onToggle, onAdd, onRemove }: HabitsStepProps) {
  return (
    <div>
      <div className={styles.stepHeader}>
        <h1 className={styles.stepTitle}>Habits to build</h1>
        <p className={styles.stepExplanation}>
          Your AI agent can help keep you accountable to the routines you're building. Or, it can help you lose those bad habits holding you back. What habits matter most to you?
        </p>
      </div>

      <SuggestionChips
        suggestions={SUGGESTIONS}
        selected={items}
        onToggle={onToggle}
        onAdd={onAdd}
        onRemove={onRemove}
        placeholder="Add a habit..."
        maxItems={8}
      />
    </div>
  );
}
