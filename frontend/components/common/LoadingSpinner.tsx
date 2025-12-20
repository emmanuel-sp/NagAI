import styles from "@/styles/common/loadingSpinner.module.css";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div className={styles.loadingState}>
      <div className={styles.loadingSpinner}></div>
      <p className={styles.loadingMessage}>{message}</p>
    </div>
  );
}
