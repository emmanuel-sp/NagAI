/**
 * LandingPage Component
 *
 * Landing page for non-authenticated users with features and CTAs
 */

import Link from "next/link";
import styles from "@/styles/pages/home.module.css";
import {
  IoConstruct,
  IoFlagOutline,
  IoDocumentText,
  IoListOutline,
  IoSparkles,
  IoRocket
} from "react-icons/io5";

export default function LandingPage() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeContent}>
        <div className={styles.homeHero}>
          <h1 className={styles.homeTitle}>NagAI</h1>
          <p className={styles.homeSubtitle}>
            Your AI-powered personal growth companion
          </p>
          <p className={styles.homeDescription}>
            Set meaningful goals, build actionable checklists, get personalized digests,
            and configure your AI agent to support your journey to success.
          </p>
        </div>

        <div className={styles.homeFeatures}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <IoFlagOutline size={48} />
            </div>
            <h3 className={styles.featureTitle}>Goal Tracking</h3>
            <p className={styles.featureText}>
              Set and monitor your personal and professional goals
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <IoListOutline size={48} />
            </div>
            <h3 className={styles.featureTitle}>Smart Checklists</h3>
            <p className={styles.featureText}>
              Break down goals into actionable steps with AI assistance
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <IoDocumentText size={48} />
            </div>
            <h3 className={styles.featureTitle}>Personalized Digests</h3>
            <p className={styles.featureText}>
              Receive curated insights, tips, and opportunities tailored to you
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <IoConstruct size={48} />
            </div>
            <h3 className={styles.featureTitle}>AI Agent Builder</h3>
            <p className={styles.featureText}>
              Configure your personal AI assistant for proactive support
            </p>
          </div>
        </div>

        <div className={styles.homeCTA}>
          <Link href="/signup" className={`${styles.ctaButton} ${styles.ctaPrimary}`}>
            <IoRocket size={20} />
            <span>Get Started</span>
          </Link>
          <Link href="/learn-more" className={`${styles.ctaButton} ${styles.ctaSecondary}`}>
            <IoSparkles size={20} />
            <span>Learn More</span>
          </Link>
        </div>

        <div className={styles.loginPrompt}>
          Already have an account?{" "}
          <Link href="/login" className={styles.loginLink}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
