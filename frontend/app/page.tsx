import Link from "next/link";
import styles from "@/styles/home.module.css";
import { IoChatbubbleEllipses, IoFlagOutline, IoDocumentText } from "react-icons/io5";

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeContent}>
        <div className={styles.homeHero}>
          <h1 className={styles.homeTitle}>NagAI</h1>
          <p className={styles.homeSubtitle}>
            Your personal productivity & goal tracking companion
          </p>
          <p className={styles.homeDescription}>
            Stay organized, track your goals, and make the most of your time.
            Simple. Clean. Effective.
          </p>
        </div>

        <div className={styles.homeFeatures}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <IoChatbubbleEllipses size={48} />
            </div>
            <h3 className={styles.featureTitle}>Chat</h3>
            <p className={styles.featureText}>
              Interact with your AI assistant
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <IoFlagOutline size={48} />
            </div>
            <h3 className={styles.featureTitle}>Goals</h3>
            <p className={styles.featureText}>
              Set and track your objectives
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <IoDocumentText size={48} />
            </div>
            <h3 className={styles.featureTitle}>Digests</h3>
            <p className={styles.featureText}>
              Organize your summaries
            </p>
          </div>
        </div>

        <div className={styles.homeCTA}>
          <Link href="/goals" className={`${styles.ctaButton} ${styles.ctaPrimary}`}>
            Get Started
          </Link>
          <Link href="/chat" className={`${styles.ctaButton} ${styles.ctaSecondary}`}>
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}