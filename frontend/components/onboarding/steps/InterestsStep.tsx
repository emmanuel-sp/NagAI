import SuggestionChips from "../SuggestionChips";
import styles from "../OnboardingWizard.module.css";

const SUGGESTIONS = [
  "Technology", "Finance", "Health & Fitness", "Personal Development",
  "Entrepreneurship", "Science", "Arts & Creativity", "Travel",
  "Education", "Sustainability", "Psychology", "Leadership",
  "Real Estate", "Cooking", "Music", "Sports", "Philosophy", "Writing",
];

interface InterestsStepProps {
  items: string[];
  onToggle: (item: string) => void;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export default function InterestsStep({ items, onToggle, onAdd, onRemove }: InterestsStepProps) {
  return (
    <div>
      <div className={styles.stepHeader}>
        <h1 className={styles.stepTitle}>What interests you?</h1>
        <p className={styles.stepExplanation}>
          Your interests help us curate relevant content for your digests and AI suggestions. Pick a few or add your own.
        </p>
      </div>

      <SuggestionChips
        suggestions={SUGGESTIONS}
        selected={items}
        onToggle={onToggle}
        onAdd={onAdd}
        onRemove={onRemove}
        placeholder="Add an interest..."
        maxItems={8}
      />
    </div>
  );
}
