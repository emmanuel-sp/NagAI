import styles from "../OnboardingWizard.module.css";

const MAX_CONTEXT = 500;

interface LifeContextStepProps {
  value: string;
  onChange: (value: string) => void;
}

function counterClass(len: number, max: number) {
  if (len >= max) return `${styles.fieldCounter} ${styles.fieldCounterAt}`;
  if (len >= max * 0.85) return `${styles.fieldCounter} ${styles.fieldCounterNear}`;
  return styles.fieldCounter;
}

export default function LifeContextStep({ value, onChange }: LifeContextStepProps) {
  return (
    <div>
      <div className={styles.stepHeader}>
        <h1 className={styles.stepTitle}>What are you working towards?</h1>
        <p className={styles.stepExplanation}>
          This is the most important field for AI personalization. It shapes every suggestion, digest, and nag you&apos;ll get from AI.
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <textarea
          className={styles.fieldTextarea}
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CONTEXT) onChange(e.target.value);
          }}
          placeholder="e.g., Building financial independence while staying healthy and present for my family. Currently focused on career growth and starting a side project..."
          style={{ minHeight: "140px" }}
          maxLength={MAX_CONTEXT}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <p className={styles.fieldHint} style={{ margin: "10px 0 0" }}>
            Think big picture: career ambitions, personal growth, health goals, relationships, projects you&apos;re passionate about.
          </p>
          {value.length > 0 && (
            <div className={counterClass(value.length, MAX_CONTEXT)} style={{ marginTop: "10px", flexShrink: 0 }}>
              {value.length}/{MAX_CONTEXT}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
