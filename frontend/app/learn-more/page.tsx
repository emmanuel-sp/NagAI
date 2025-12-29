/**
 * Learn More Page
 *
 * Detailed information about NagAI features and capabilities
 */

import Link from "next/link";
import styles from "@/styles/pages/learn-more.module.css";
import {
  IoFlagOutline,
  IoListOutline,
  IoDocumentText,
  IoConstruct,
  IoSparkles,
  IoCheckmarkCircle,
  IoRocket,
  IoArrowBack
} from "react-icons/io5";

export const metadata = {
  title: "Learn More | NagAI",
  description: "Discover how NagAI can help you achieve your personal and professional goals",
};

export default function LearnMorePage() {
  return (
    <div className={styles.learnMoreContainer}>
      <div className={styles.learnMoreContent}>
        <Link href="/" className={styles.backLink}>
          <IoArrowBack size={20} />
          <span>Back to Home</span>
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to NagAI</h1>
          <p className={styles.subtitle}>
            Your AI-powered companion for personal growth and goal achievement
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What is NagAI?</h2>
          <p className={styles.sectionText}>
            NagAI is a comprehensive personal growth platform that combines goal tracking,
            intelligent task management, personalized content delivery, and AI assistance to
            help you achieve your dreams. Whether you're working on career goals, personal
            development, health objectives, or learning new skills, NagAI keeps you organized,
            motivated, and on track.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureSection}>
            <div className={styles.featureHeader}>
              <IoFlagOutline size={32} className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Goal Tracking</h3>
            </div>
            <p className={styles.featureDescription}>
              Create and monitor your personal and professional goals with detailed tracking.
              Set deadlines, track progress, and visualize your journey to success.
            </p>
            <ul className={styles.featureList}>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Set short-term and long-term goals</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Track progress with visual indicators</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Organize goals by category and priority</span>
              </li>
            </ul>
          </div>

          <div className={styles.featureSection}>
            <div className={styles.featureHeader}>
              <IoListOutline size={32} className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Smart Checklists</h3>
            </div>
            <p className={styles.featureDescription}>
              Break down your goals into actionable steps. Generate checklists automatically
              or create custom ones to keep yourself organized and focused.
            </p>
            <ul className={styles.featureList}>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>AI-generated checklist suggestions</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Mark items as complete and track progress</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Link checklists to specific goals</span>
              </li>
            </ul>
          </div>

          <div className={styles.featureSection}>
            <div className={styles.featureHeader}>
              <IoDocumentText size={32} className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Personalized Digests</h3>
            </div>
            <p className={styles.featureDescription}>
              Receive curated content tailored to your interests and goals. Choose what
              types of content you want and when you want to receive them.
            </p>
            <ul className={styles.featureList}>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Nearby opportunities and events</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Motivational content and affirmations</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Knowledge snippets and practical tips</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Customizable delivery schedule</span>
              </li>
            </ul>
          </div>

          <div className={styles.featureSection}>
            <div className={styles.featureHeader}>
              <IoConstruct size={32} className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>AI Agent Builder</h3>
            </div>
            <p className={styles.featureDescription}>
              Configure your personal AI assistant to provide proactive support through your
              preferred communication channels. Set up contexts for more personalized interactions.
            </p>
            <ul className={styles.featureList}>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Customize communication preferences</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Define custom contexts for better assistance</span>
              </li>
              <li>
                <IoCheckmarkCircle size={18} />
                <span>Deploy or pause your agent anytime</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h4 className={styles.stepTitle}>Create Your Profile</h4>
              <p className={styles.stepText}>
                Sign up and tell us about your goals, interests, and aspirations
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h4 className={styles.stepTitle}>Set Your Goals</h4>
              <p className={styles.stepText}>
                Define your objectives and organize them by priority and timeline
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h4 className={styles.stepTitle}>Build Action Plans</h4>
              <p className={styles.stepText}>
                Create checklists with actionable steps to achieve your goals
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <h4 className={styles.stepTitle}>Configure Your AI</h4>
              <p className={styles.stepText}>
                Set up personalized digests and your AI agent for ongoing support
              </p>
            </div>
          </div>
        </div>

        <div className={styles.ctaSection}>
          <IoSparkles size={48} className={styles.ctaIcon} />
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaText}>
            Join NagAI today and start your journey toward achieving your goals
          </p>
          <Link href="/signup" className={styles.ctaButton}>
            <IoRocket size={20} />
            <span>Create Your Account</span>
          </Link>
          <p className={styles.loginText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.loginLink}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
