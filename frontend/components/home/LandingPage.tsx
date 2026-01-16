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

        

        <div className={styles.homeCTA}>
          <Link href="/signup" className={`${styles.ctaButton} ${styles.ctaPrimary}`}>
  
            <span>Get Started</span>
          </Link>
          <Link href="/learn-more" className={`${styles.ctaButton} ${styles.ctaSecondary}`}>

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
