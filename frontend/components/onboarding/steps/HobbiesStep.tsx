import SuggestionChips from "../SuggestionChips";
import styles from "../OnboardingWizard.module.css";

const SUGGESTIONS = [
  "Reading", "Running", "Cooking", "Photography", "Gaming", "Hiking",
  "Painting", "Yoga", "Gardening", "Cycling", "Writing", "Playing Music",
  "Meditation", "Weightlifting", "Swimming", "Chess", "Podcasting", "Woodworking",
];

interface HobbiesStepProps {
  items: string[];
  onToggle: (item: string) => void;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export default function HobbiesStep({ items, onToggle, onAdd, onRemove }: HobbiesStepProps) {
  return (
    <div>
      <div className={styles.stepHeader}>
        <h1 className={styles.stepTitle}>What do you love doing?</h1>
        <p className={styles.stepExplanation}>
          Hobbies give our AI a fuller picture of who you are beyond work. This helps it more deeply understand you.
        </p>
      </div>

      <SuggestionChips
        suggestions={SUGGESTIONS}
        selected={items}
        onToggle={onToggle}
        onAdd={onAdd}
        onRemove={onRemove}
        placeholder="Add a hobby..."
        maxItems={8}
      />
    </div>
  );
}
