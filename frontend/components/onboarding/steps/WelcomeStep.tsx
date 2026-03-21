import { IoFlag, IoMail, IoZap } from "@/components/icons";
import styles from "../OnboardingWizard.module.css";

interface WelcomeStepProps {
  userName: string;
}

export default function WelcomeStep({ userName }: WelcomeStepProps) {
  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div>
      <div className={styles.stepHeader}>
        <h1 className={styles.welcomeTitle}>Welcome, {firstName}</h1>
        <p className={styles.stepExplanation}>
          Let&apos;s set up your profile so NagAI can give you personalized
          guidance. This only takes a minute.
        </p>
      </div>

      <ul className={styles.featureList}>
        <li className={styles.featureItem}>
          <div className={styles.featureIcon}>
            <IoFlag size={17} />
          </div>
          <div className={styles.featureText}>
            <div className={styles.featureLabel}>Set meaningful goals</div>
            <div className={styles.featureDesc}>
              Use the SMART framework to create clear, achievable goals
            </div>
          </div>
        </li>
        <li className={styles.featureItem}>
          <div className={styles.featureIcon}>
            <IoMail size={17} />
          </div>
          <div className={styles.featureText}>
            <div className={styles.featureLabel}>Get AI-powered digests</div>
            <div className={styles.featureDesc}>
              Receive curated content and progress updates on your schedule
            </div>
          </div>
        </li>
        <li className={styles.featureItem}>
          <div className={styles.featureIcon}>
            <IoZap size={17} />
          </div>
          <div className={styles.featureText}>
            <div className={styles.featureLabel}>Build accountability</div>
            <div className={styles.featureDesc}>
              A nagging AI agent that keeps you on track with nudges and
              guidance
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
