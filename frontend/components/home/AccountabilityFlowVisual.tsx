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
              <span className={styles.typedText}>
                Get promoted to senior engineer.
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
          <p className={styles.mobileGoal}>Goal: Get promoted to senior engineer.</p>
          <div className={styles.checklistHeader}>
            <span className={styles.eyebrow}>Generated checklist</span>
            <span className={styles.checklistMeta}>4 actionable items</span>
          </div>
          <div className={styles.checklistItems}>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Schedule promotion criteria chat with manager</p>
                <p className={styles.itemNote}>This week</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Volunteer to lead the Q2 platform migration</p>
                <p className={styles.itemNote}>By end of sprint</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Start a weekly wins log</p>
                <p className={styles.itemNote}>Every Friday</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Get peer feedback from 3 teammates</p>
                <p className={styles.itemNote}>Before Q3 review</p>
              </div>
            </div>
          </div>
          <div className={styles.checklistFooter}>
            <span className={styles.footerChip}>Goal-specific</span>
            <span className={styles.footerChip}>Editable</span>
            <span className={styles.footerChip}>Ready to start</span>
          </div>
        </div>
      </div>
    </div>
  );
}
