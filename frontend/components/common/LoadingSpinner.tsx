import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  message?: string;
  hint?: string;
  variant?: "page" | "inline" | "card";
}

export default function LoadingSpinner({
  message = "Loading...",
  hint,
  variant = "page",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${styles.loadingState} ${styles[`loadingState${variant[0].toUpperCase()}${variant.slice(1)}`]}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.loadingBadge}>
        <div className={styles.loadingSpinner} aria-hidden="true">
          <span className={styles.loadingSpinnerRing}></span>
          <span className={styles.loadingSpinnerCore}></span>
        </div>
        <div className={styles.loadingCopy}>
          <p className={styles.loadingMessage}>{message}</p>
          {hint ? <p className={styles.loadingHint}>{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
