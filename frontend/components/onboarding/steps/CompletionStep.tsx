import { IoCheckmarkCircle } from "@/components/icons";
import styles from "../OnboardingWizard.module.css";

interface CompletionStepProps {
  age: number | undefined;
  career: string;
  bio: string;
  lifeContext: string;
  interests: string[];
  hobbies: string[];
  habits: string[];
}

const AI_FIELDS: Array<{ key: keyof CompletionStepProps; label: string }> = [
  { key: "age", label: "Age" },
  { key: "career", label: "Career" },
  { key: "bio", label: "Bio" },
  { key: "interests", label: "Interests" },
  { key: "hobbies", label: "Hobbies" },
  { key: "habits", label: "Habits" },
  { key: "lifeContext", label: "Life context" },
];

function isFilled(val: unknown): boolean {
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "number") return true;
  return typeof val === "string" && val.trim().length > 0;
}

export default function CompletionStep(props: CompletionStepProps) {
  const filledCount = AI_FIELDS.filter(({ key }) => isFilled(props[key])).length;

  const renderChips = (items: string[]) => {
    if (items.length === 0) return <span className={styles.summaryEmpty}>None yet</span>;
    return (
      <div className={styles.summaryChips}>
        {items.map((item) => (
          <span key={item} className={styles.summaryChip}>{item}</span>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className={styles.completionIcon}>
        <IoCheckmarkCircle size={32} />
      </div>
      <div className={styles.stepHeader}>
        <h1 className={styles.stepTitle}>You&apos;re all set!</h1>
        <p className={styles.stepExplanation}>
          Here&apos;s a summary of your profile. You can always edit these later in your profile settings.
        </p>
      </div>

      <div className={styles.contextBar}>
        <div className={styles.contextBarTrack}>
          <div className={styles.contextBarFill} style={{ width: `${(filledCount / AI_FIELDS.length) * 100}%` }} />
        </div>
        <div className={styles.contextBarLabel}>
          {filledCount} of {AI_FIELDS.length} AI context fields filled
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Age</span>
          <span className={props.age ? styles.summaryValue : styles.summaryEmpty}>
            {props.age ?? "Not set"}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Career</span>
          <span className={props.career ? styles.summaryValue : styles.summaryEmpty}>
            {props.career || "Not set"}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Bio</span>
          <span className={props.bio ? styles.summaryValue : styles.summaryEmpty}>
            {props.bio || "Not set"}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Context</span>
          <span className={props.lifeContext ? styles.summaryValue : styles.summaryEmpty}>
            {props.lifeContext || "Not set"}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Interests</span>
          {renderChips(props.interests)}
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Hobbies</span>
          {renderChips(props.hobbies)}
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Habits</span>
          {renderChips(props.habits)}
        </div>
      </div>
    </div>
  );
}
