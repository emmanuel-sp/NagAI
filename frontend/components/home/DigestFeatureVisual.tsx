import styles from "./DigestFeatureVisual.module.css";

const digestSections = [
  {
    label: "Motivation",
    content:
      "A short perspective shift on how to keep momentum when progress feels slower than expected, plus affirmations and motivational quotes tailored to your journey.",
  },
  {
    label: "Practical tip",
    content:
      "A concise idea for protecting your highest-focus block before reactive work starts crowding the day, alongside practical tips and reflection prompts you can actually use.",
  },
  {
    label: "Relevant reading",
    content:
      "Curated news, knowledge snippets, resource recommendations, and progress insights tied to your selected interests so support feels useful, not generic.",
  },
];

export default function DigestFeatureVisual() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Digest support</p>
            <h3 className={styles.title}>Curated reading that supports the work without nagging you</h3>
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
