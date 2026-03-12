"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./LandingPage.module.css";
import { IoCheckmarkCircle } from "@/components/icons";

/* ─── Scroll Reveal Hook ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ─── Landing Nav (only for logged-out users; logged-in users see the main NavBar) ─── */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`${styles.landingNav} ${scrolled ? styles.landingNavScrolled : ""}`}>
      <Link href="/" className={styles.logoLink}>
        NagAI
      </Link>
      <div className={styles.navActions}>
        <Link href="/login" className={styles.navLogin}>
          Log in
        </Link>
        <Link href="/signup" className={styles.navSignup}>
          Get Started
        </Link>
      </div>
    </nav>
  );
}

/* ─── Mockup Placeholder ─── */
function MockupPlaceholder({
  label,
  aspectRatio = "16 / 9",
  className,
}: {
  label: string;
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`${styles.mockup} ${className || ""}`}
      style={{ aspectRatio }}
    >
      <div className={styles.mockupInner}>
        <div className={styles.mockupDots}>
          <span />
          <span />
          <span />
        </div>
        <p className={styles.mockupLabel}>{label}</p>
      </div>
    </div>
  );
}

/* ─── Data ─── */
const features = [
  {
    label: "GOAL TRACKING",
    title: "Set structured goals with AI-assisted criteria",
    description:
      "Create and monitor your personal and professional goals with detailed tracking. Set deadlines, track progress, and visualize your journey to success.",
    bullets: [
      "Set short-term and long-term goals",
      "Track progress with visual indicators",
      "Organize goals by category and priority",
    ],
    mockupLabel:
      "Goals page — goal cards with progress bars and SMART criteria",
  },
  {
    label: "SMART CHECKLISTS",
    title: "Break down goals into actionable steps",
    description:
      "Generate checklists automatically or create custom ones to keep yourself organized and focused.",
    bullets: [
      "AI-generated checklist suggestions",
      "Mark items as complete and track progress",
      "Link checklists to specific goals",
    ],
    mockupLabel:
      "Checklists page — checklist items with checkboxes and linked goals",
  },
  {
    label: "PERSONALIZED DIGESTS",
    title: "Curated content tailored to your journey",
    description:
      "Receive curated content tailored to your interests and goals. Choose what types of content you want and when you want to receive them.",
    bullets: [
      "Nearby opportunities and events",
      "Motivational content and affirmations",
      "Knowledge snippets and practical tips",
      "Customizable delivery schedule",
    ],
    mockupLabel:
      "Digest builder — content type selection and delivery schedule",
  },
  {
    label: "AI AGENT BUILDER",
    title: "Your personal AI accountability partner",
    description:
      "Configure your personal AI assistant to provide proactive support through your preferred communication channels.",
    bullets: [
      "Customize communication preferences",
      "Define custom contexts for better assistance",
      "Deploy or pause your agent anytime",
    ],
    mockupLabel:
      "Agent builder — config panel with communication channels and deploy controls",
  },
];

const steps = [
  {
    number: "1",
    title: "Create Your Profile",
    text: "Sign up and set up your personal profile in seconds",
  },
  {
    number: "2",
    title: "Set Your Goals",
    text: "Define your objectives using the SMART goal framework",
  },
  {
    number: "3",
    title: "Build Action Plans",
    text: "Create checklists with actionable steps, powered by AI",
  },
  {
    number: "4",
    title: "Configure Your AI",
    text: "Set up personalized digests and an AI agent for ongoing support",
  },
];

/* ─── Main Component ─── */
export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const hero = useScrollReveal(0.1);
  const featureRefs = [
    useScrollReveal(0.12),
    useScrollReveal(0.12),
    useScrollReveal(0.12),
    useScrollReveal(0.12),
  ];
  const howItWorks = useScrollReveal(0.1);
  const cta = useScrollReveal(0.15);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("authToken"));
  }, []);

  return (
    <div className={styles.landing}>
      {!isLoggedIn && <LandingNav />}

      {/* ─── Hero ─── */}
      <section
        ref={hero.ref}
        className={`${styles.heroSection} ${hero.isVisible ? styles.visible : ""}`}
      >
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>AI-Powered Accountability</div>
          <h1 className={styles.headline}>
            Set defined goals.
            <br />
            <span className={styles.headlineAccent}><em>Personalize Support.</em></span>
          </h1>
          <p className={styles.subline}>
            NagAI turns your goals into action with intelligent nudges, daily
            digests, and an AI agent that holds you accountable.
          </p>
          {!isLoggedIn && (
            <div className={styles.heroActions}>
              <Link href="/signup" className={styles.primaryCta}>
                Get Started
              </Link>
              <Link href="/login" className={styles.secondaryCta}>
                Log in
              </Link>
            </div>
          )}
        </div>
        <div className={styles.heroMockupWrap}>
          <MockupPlaceholder
            label="Dashboard overview — goals, checklists, and digest summary at a glance"
            aspectRatio="16 / 9"
            className={styles.heroMockup}
          />
        </div>
      </section>

      {/* ─── Feature Sections ─── */}
      {features.map((feature, i) => {
        const reveal = featureRefs[i];
        const reversed = i % 2 === 1;
        return (
          <section
            key={feature.label}
            ref={reveal.ref}
            className={`${styles.featureSection} ${reversed ? styles.featureReversed : ""} ${reveal.isVisible ? styles.visible : ""}`}
          >
            <div className={styles.featureGrid}>
              <div className={styles.featureTextCol}>
                <span className={styles.featureEyebrow}>
                  {feature.label}
                </span>
                <h2 className={styles.featureTitle}>{feature.title}</h2>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
                <ul className={styles.featureList}>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>
                      <IoCheckmarkCircle size={18} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <MockupPlaceholder
                label={feature.mockupLabel}
                aspectRatio="4 / 3"
                className={styles.featureMockup}
              />
            </div>
          </section>
        );
      })}

      {/* ─── How It Works ─── */}
      <section
        ref={howItWorks.ref}
        className={`${styles.howSection} ${howItWorks.isVisible ? styles.visible : ""}`}
      >
        <div className={styles.howInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeadline}>How It Works</h2>
            <p className={styles.sectionSubline}>
              Get up and running in four simple steps
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.number} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section
        ref={cta.ref}
        className={`${styles.ctaSection} ${cta.isVisible ? styles.visible : ""}`}
      >
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaHeadline}>
            Ready to start achieving your goals?
          </h2>
          <p className={styles.ctaSubline}>
            Join NagAI today and let AI hold you accountable.
          </p>
          {!isLoggedIn && (
            <>
              <Link href="/signup" className={styles.ctaButton}>
                Create Your Account
              </Link>
              <p className={styles.ctaLogin}>
                Already have an account?{" "}
                <Link href="/login" className={styles.ctaLoginLink}>
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
