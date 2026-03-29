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
                I want to launch NagAI with a landing page that actually converts.
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
                <p className={styles.itemTitle}>Lock the landing page headline</p>
                <p className={styles.itemNote}>Focus on sharper positioning and promise</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Generate the supporting feature visuals</p>
                <p className={styles.itemNote}>Show real use, not screenshots</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Refine copy to highlight goals and AI checklists</p>
                <p className={styles.itemNote}>Demote supporting features that clutter the story</p>
              </div>
            </div>
            <div className={styles.item}>
              <span className={styles.itemDot} />
              <div>
                <p className={styles.itemTitle}>Use agent support when follow-through gets fuzzy</p>
                <p className={styles.itemNote}>Chat and nags stay there when needed</p>
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
