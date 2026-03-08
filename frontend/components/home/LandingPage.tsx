/**
 * LandingPage Component
 *
 * Landing page for non-authenticated users
 */

import Link from "next/link";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>AI-Powered Accountability</div>
        <h1 className={styles.headline}>
          Stop planning.<br />
          <span className={styles.headlineAccent}>Start doing.</span>
        </h1>
        <p className={styles.subline}>
          NagAI turns your goals into action with intelligent nudges,
          daily digests, and an AI agent that holds you accountable.
        </p>
        <div className={styles.actions}>
          <Link href="/signup" className={styles.primaryCta}>
            Get Started
          </Link>
          <Link href="/learn-more" className={styles.secondaryCta}>
            Learn more
          </Link>
        </div>
        <p className={styles.footnote}>
          Already have an account?{" "}
          <Link href="/login" className={styles.footnoteLink}>
            Log in
          </Link>
        </p>
      </div>

      <div className={styles.featureDivider} />

      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureLabel}>SMART Goals</span>
          <span className={styles.featureText}>Set structured goals with AI-assisted criteria and track progress over time.</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureLabel}>Daily Digests</span>
          <span className={styles.featureText}>Get personalized email or SMS summaries of your goals and checklist progress.</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureLabel}>AI Agent</span>
          <span className={styles.featureText}>Deploy an accountability agent that nags, motivates, or guides you toward your goals.</span>
        </div>
      </div>
    </div>
  );
}
