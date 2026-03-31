import styles from "./AccountabilityFlowVisual.module.css";

export default function AccountabilityFlowVisual() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.shell}>
        <div className={styles.goalPanel}>
          <div className={styles.goalHeader}>
            <span className={styles.eyebrow}>Start with a goal</span>
            <span className={styles.status}>AI-assisted</span>
          </div>
          <div className={styles.promptRow}>
            <span className={styles.promptLabel}>You type</span>
            <div className={styles.promptField}>
              <span className={styles.typingViewport}>
                <span className={styles.typedText}>
                  Run a sub-24 minute 5K this fall.
                </span>
                <span className={styles.typingCover} />
              </span>
            </div>
          </div>
          <div className={styles.goalSummary}>
            <div className={styles.summaryLine} />
            <div className={styles.summaryLineShort} />
          </div>
        </div>

        <div className={styles.transformCore}>
          <div className={styles.sparkHalo} />
          <div className={styles.sparkCore}>
            <span>AI</span>
          </div>
          <p className={styles.transformLabel}>Turns a goal into concrete steps</p>
        </div>

        <div className={styles.checklistPanel}>
          <div className={styles.checklistHeader}>
            <span className={styles.eyebrow}>Generated checklist</span>
            <span className={styles.checklistMeta}>4 actionable items</span>
          </div>
          <div className={styles.checklistItems}>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Run three times a week consistently</p>
                <p className={styles.itemNote}>Base first</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Add one weekly speed workout</p>
                <p className={styles.itemNote}>Build pace</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Build your long run to 6 miles</p>
                <p className={styles.itemNote}>Endurance</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Retest your 5K pace each month</p>
                <p className={styles.itemNote}>Track progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
