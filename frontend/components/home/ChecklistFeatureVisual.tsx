import styles from "./ChecklistFeatureVisual.module.css";

type MarketingChecklistItem = {
  title: string;
  meta: string;
  completed?: boolean;
  emphasized?: boolean;
};

const checklistItems: MarketingChecklistItem[] = [
  {
    title: "Outline the first-time user onboarding flow",
    meta: "AI note: start with signup, goal setup, then checklist handoff",
    completed: true,
  },
  {
    title: "Write success criteria for the launch checklist",
    meta: "Due Tue, Apr 2",
    completed: true,
  },
  {
    title: "Draft the accountability reminder cadence",
    meta: "AI suggestion refined from your productivity profile",
    emphasized: true,
  },
  {
    title: "Review blockers before tomorrow's sprint planning",
    meta: "Due Wed, Apr 3",
  },
  {
    title: "Ship the polished landing page visual demo",
    meta: "Added by AI from your goal context",
  },
];

export default function ChecklistFeatureVisual() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.backgroundGlow} />
      <div className={styles.cardShell}>
        <div className={styles.statusPill}>Goal-linked checklist</div>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Generate checklist</p>
            <h3 className={styles.goalTitle}>
              Launch NagAI with a sharper landing page
            </h3>
          </div>
          <div className={styles.progressCluster}>
            <span className={styles.progressLabel}>2 of 5 done</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} />
            </div>
          </div>
        </div>

        <div className={styles.generatorRow}>
          <div className={styles.sparkOrb}>
            <span className={styles.sparkCore} />
          </div>
          <div className={styles.generatorCopy}>
            <span className={styles.generatorLabel}>AI planner</span>
            <p className={styles.generatorText}>
              Turn this goal into the next best actions.
            </p>
          </div>
          <button className={styles.generateButton} type="button" tabIndex={-1}>
            Generate Checklist with AI
          </button>
        </div>

        <div className={styles.list}>
          {checklistItems.map((item) => (
            <div
              key={item.title}
              className={[
                styles.itemRow,
                item.completed ? styles.itemComplete : "",
                item.emphasized ? styles.itemEmphasized : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.checkbox}>
                {item.completed ? <span className={styles.checkboxDot} /> : null}
              </span>
              <div className={styles.itemCopy}>
                <p className={styles.itemTitle}>{item.title}</p>
                <p className={styles.itemMeta}>{item.meta}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footerNote}>
          <span className={styles.footerBadge}>Live AI structure</span>
          <p>
            Every task is editable, goal-specific, and ready to turn into daily
            action.
          </p>
        </div>
      </div>
    </div>
  );
}
