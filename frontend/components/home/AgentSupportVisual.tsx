import styles from "./AgentSupportVisual.module.css";

const quizOptions = [
  "Career growth",
  "Health",
  "Creative project",
  "Learning",
];

export default function AgentSupportVisual() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>AI Agent + Chat</p>
          </div>
          <span className={styles.status}>Agent chat</span>
        </div>

        <div className={styles.messageBlock}>
          <p className={styles.agentLabel}>Agent</p>
          <p className={styles.agentText}>
            Got a nag email about your goal? Continue here. Or start fresh—I
            can help you define a goal, clear a blocker, or pick the next move.
          </p>
        </div>

        <div className={styles.quizCard}>
          <p className={styles.quizQuestion}>What area feels most important right now?</p>
          <div className={styles.quizOptions}>
            {quizOptions.map((option) => (
              <span key={option} className={styles.quizChip}>
                {option}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.followUp}>
          <div className={styles.followUpCard}>
            <span className={styles.followUpLabel}>After a nag email</span>
            <p>Continue the thread when an email check-in raises a real question.</p>
          </div>
          <div className={styles.followUpCard}>
            <span className={styles.followUpLabel}>While working</span>
            <p>Clarify a checklist item or figure out what to do next.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
