import styles from "../OnboardingWizard.module.css";

const MAX_CAREER = 100;
const MAX_BIO = 500;

interface AboutYouStepProps {
  age: number | undefined;
  career: string;
  bio: string;
  onAgeChange: (value: number | undefined) => void;
  onCareerChange: (value: string) => void;
  onBioChange: (value: string) => void;
}

function counterClass(len: number, max: number) {
  if (len >= max) return `${styles.fieldCounter} ${styles.fieldCounterAt}`;
  if (len >= max * 0.85) return `${styles.fieldCounter} ${styles.fieldCounterNear}`;
  return styles.fieldCounter;
}

export default function AboutYouStep({
  age,
  career,
  bio,
  onAgeChange,
  onCareerChange,
  onBioChange,
}: AboutYouStepProps) {
  return (
    <div>
      <div className={styles.stepHeader}>
        <h1 className={styles.stepTitle}>About you</h1>
        <p className={styles.stepExplanation}>
          This helps our AI understand your background and give relevant, personalized advice.
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Age</label>
        <input
          type="number"
          className={styles.fieldInput}
          value={age ?? ""}
          onChange={(e) => onAgeChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          placeholder="e.g., 28"
          min={1}
          max={120}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Career</label>
        <input
          type="text"
          className={styles.fieldInput}
          value={career}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CAREER) onCareerChange(e.target.value);
          }}
          placeholder="e.g., Software Engineer, Student, Entrepreneur"
          maxLength={MAX_CAREER}
        />
        {career.length > 0 && (
          <div className={counterClass(career.length, MAX_CAREER)}>
            {career.length}/{MAX_CAREER}
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Short bio</label>
        <textarea
          className={styles.fieldTextarea}
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= MAX_BIO) onBioChange(e.target.value);
          }}
          placeholder="A few words about who you are..."
          maxLength={MAX_BIO}
        />
        {bio.length > 0 && (
          <div className={counterClass(bio.length, MAX_BIO)}>
            {bio.length}/{MAX_BIO}
          </div>
        )}
      </div>
    </div>
  );
}
