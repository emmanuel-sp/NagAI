import styles from "./DailyPlanFeatureVisual.module.css";

const planItems = [
  {
    time: "8:30",
    title: "Morning review + plan the day",
    note: "Recurring routine",
    tone: "neutral",
  },
  {
    time: "10:00",
    title: "Write first draft of onboarding email",
    note: "From your launch goal checklist",
    tone: "accent",
  },
  {
    time: "13:00",
    title: "Code review — Sarah's auth PR",
    note: "Scheduled block",
    tone: "neutral",
  },
  {
    time: "16:30",
    title: "Update project status doc",
    note: "End-of-day wrap",
    tone: "soft",
  },
];

export default function DailyPlanFeatureVisual() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Daily plan</p>
            <h3 className={styles.title}>A focused day, shaped from your goals and routines</h3>
          </div>
          <div className={styles.badge}>Tue</div>
        </div>

        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} />
          </div>
          <span className={styles.progressText}>3 focused blocks, 1 reset, 1 wrap-up</span>
        </div>

        <div className={styles.planList}>
          {planItems.map((item) => (
            <div
              key={item.time + item.title}
              className={[
                styles.planItem,
                item.tone === "accent" ? styles.planItemAccent : "",
                item.tone === "soft" ? styles.planItemSoft : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.time}>{item.time}</span>
              <div className={styles.itemCopy}>
                <p className={styles.itemTitle}>{item.title}</p>
                <p className={styles.itemNote}>{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
