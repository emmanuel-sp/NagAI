import styles from "./OnboardingWizard.module.css";

interface ProgressBarProps {
  /** The wizard step index (0 = welcome, 1-5 = form, 6 = completion) */
  currentStep: number;
}

const FORM_STEPS = 5; // steps 1 through 5

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  // Only render for the form steps (1-5)
  if (currentStep < 1 || currentStep > FORM_STEPS) return null;

  const formStep = currentStep; // 1-indexed already

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        {Array.from({ length: FORM_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`${styles.progressSegment} ${i < formStep ? styles.progressSegmentActive : ""}`}
          />
        ))}
      </div>
      <div className={styles.progressLabel}>
        {formStep} of {FORM_STEPS}
      </div>
    </div>
  );
}
