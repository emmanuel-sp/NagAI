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
            <p className={styles.eyebrow}>Chat support</p>
            <h3 className={styles.title}>Talk through a goal, a blocker, or the next move</h3>
          </div>
          <span className={styles.status}>Agent chat</span>
        </div>

        <div className={styles.messageBlock}>
          <p className={styles.agentLabel}>Agent</p>
          <p className={styles.agentText}>
            Want help figuring out your next goal? I can narrow it down with a
            quick quiz, then help you stay on track when the plan gets messy.
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
            <span className={styles.followUpLabel}>After a nag</span>
            <p>Continue the thread when a proactive nudge uncovers a real blocker.</p>
          </div>
          <div className={styles.followUpCard}>
            <span className={styles.followUpLabel}>While working</span>
            <p>Use chat to clarify a checklist item, rethink the plan, or choose the next step.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
