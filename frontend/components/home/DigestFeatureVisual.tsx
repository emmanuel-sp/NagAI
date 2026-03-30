import styles from "./DigestFeatureVisual.module.css";

const digestSections = [
  {
    label: "Motivation",
    content: "A quick perspective on staying consistent when progress feels invisible.",
  },
  {
    label: "Practical tip",
    content: "One actionable idea tied to your current focus.",
  },
  {
    label: "Relevant reading",
    content: "News and articles matched to your chosen interests.",
  },
];

export default function DigestFeatureVisual() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Email digest</p>
            <h3 className={styles.title}>Curated reading, delivered to your inbox</h3>
          </div>
          <span className={styles.status}>Weekly</span>
        </div>

        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <span className={styles.previewEyebrow}>This week&apos;s digest</span>
            <span className={styles.previewNote}>Curated for you</span>
          </div>

          <div className={styles.sections}>
            {digestSections.map((section) => (
              <div key={section.label} className={styles.section}>
                <span className={styles.sectionLabel}>{section.label}</span>
                <p className={styles.sectionContent}>{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
