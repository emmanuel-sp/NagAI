"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./LandingPage.module.css";
import AccountabilityFlowVisual from "./AccountabilityFlowVisual";
import DailyPlanFeatureVisual from "./DailyPlanFeatureVisual";
import DigestFeatureVisual from "./DigestFeatureVisual";
import AgentSupportVisual from "./AgentSupportVisual";

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

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`${styles.landingNav} ${scrolled ? styles.landingNavScrolled : ""}`}
    >
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

const features: {
  id: string;
  label: string;
  title: string;
  description: string;
  bullets: string[];
}[] = [
  {
    id: "goals",
    label: "SMART GOALS",
    title: "Turn vague intentions into goals worth acting on",
    description:
      "AI helps you build specific, measurable goals one field at a time—using your profile to make suggestions actually relevant to your life.",
    bullets: [
      "AI suggests each SMART field as you go",
      "Your profile context makes guidance more personal",
      "Finish with a concrete target, not a vague idea",
    ],
  },
  {
    id: "daily-plan",
    label: "DAILY PLAN",
    title: "A focused day shaped from your goals and checklist",
    description:
      "Pull your active goals and checklist progress into a lightweight daily plan—so the system helps you act today, not just organize tomorrow.",
    bullets: [
      "Builds from your active goals and open checklist items",
      "Add recurring routines alongside focused work blocks",
      "Light enough to actually use every day",
    ],
  },
  {
    id: "chat-support",
    label: "AI AGENT + CHAT",
    title: "Deploy an agent that follows up—and chat when you need real support",
    description:
      "Assign an AI agent to any goal and it will proactively reach out by email—check-ins, nudges, and progress prompts. When a nag sparks a real question, continue the conversation in chat.",
    bullets: [
      "Deploy a per-goal agent that sends proactive email check-ins",
      "Agents adapt their style—motivator, guide, or accountability nag",
      "Use chat to define goals, unblock checklist items, or follow up after an email nag",
    ],
  },
  {
    id: "digests",
    label: "EMAIL DIGESTS",
    title: "Curated digest emails, delivered on your schedule",
    description:
      "Choose your topics and cadence—NagAI sends a personalized email digest with motivation, practical tips, and reading tied to your interests.",
    bullets: [
      "Delivered to your inbox weekly or daily",
      "Motivation, tips, and curated articles matched to your interests",
      "Separate from agent nags—this is content, not a check-in",
    ],
  },
];

const steps = [
  {
    number: "1",
    title: "Set up your profile",
    text: "A few details make AI suggestions personal, not generic.",
  },
  {
    number: "2",
    title: "Build a real goal",
    text: "AI guides you to a specific, measurable target you can act on.",
  },
  {
    number: "3",
    title: "Work today's plan",
    text: "Your goals and checklist shape a focused daily action list.",
  },
  {
    number: "4",
    title: "Get nagged until you ship",
    text: "Email check-ins, chat support, and digest emails keep you moving.",
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const hero = useScrollReveal(0.1);
  const showcase = useScrollReveal(0.1);
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

      <section
        ref={hero.ref}
        className={`${styles.heroSection} ${hero.isVisible ? styles.visible : ""}`}
      >
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>AI goal accountability</p>
          <h1 className={styles.headline}>
            Build goals that stick.
            <br />
            <span className={styles.headlineAccent}>
              <em>With AI that follows up.</em>
            </span>
          </h1>
          <p className={styles.subline}>
            NagAI turns vague intentions into SMART goals, generates your
            action plan, and deploys an AI agent that keeps you
            accountable—right in your inbox.
          </p>
          <div className={styles.heroMeta}>
            <span>SMART goal builder</span>
            <span>AI-generated checklists</span>
            <span>Email nags + digests</span>
          </div>
          <div className={styles.heroActions}>
            {isLoggedIn ? (
              <>
                <Link href="/home" className={styles.primaryCta}>
                  Go to Dashboard
                </Link>
                <Link href="/goals" className={styles.secondaryCta}>
                  View Goals
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className={styles.primaryCta}>
                  Build My First Goal
                </Link>
                <Link href="/login" className={styles.secondaryCta}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section
        ref={showcase.ref}
        className={`${styles.showcaseSection} ${showcase.isVisible ? styles.visible : ""}`}
      >
        <div className={styles.showcaseInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeadline}>From goal to next steps</h2>
            <p className={styles.sectionSubline}>
              Type a goal. Get a concrete checklist. Start today.
            </p>
          </div>
          <div className={styles.showcaseVisual}>
            <AccountabilityFlowVisual />
          </div>
        </div>
      </section>

      {features.map((feature, i) => {
        const reveal = featureRefs[i];
        const visualKind =
          feature.id === "daily-plan"
            ? "daily-plan"
            : feature.id === "chat-support"
              ? "chat-support"
              : feature.id === "digests"
                ? "digests"
                : null;
        const visualOnLeft = feature.id === "chat-support";

        return (
          <section
            key={feature.id}
            id={feature.id}
            ref={reveal.ref}
            className={[
              styles.featureSection,
              i % 2 === 1 ? styles.featureAlt : "",
              reveal.isVisible ? styles.visible : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={styles.featureInner}>
              <div
                className={[
                  styles.featureContent,
                  visualKind ? styles.featureContentWithVisual : "",
                  visualOnLeft ? styles.featureContentVisualLeft : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div
                  className={[
                    styles.featureCopy,
                    visualKind ? styles.featureCopyVisual : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className={styles.featureEyebrow}>{feature.label}</span>
                  <h2 className={styles.featureTitle}>{feature.title}</h2>
                  <p className={styles.featureDescription}>{feature.description}</p>
                  <ul className={styles.featureList}>
                    {feature.bullets.map((bullet) => (
                      <li key={bullet}>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {visualKind === "daily-plan" ? (
                  <div className={styles.featureVisual}>
                    <DailyPlanFeatureVisual />
                  </div>
                ) : null}

                {visualKind === "chat-support" ? (
                  <div className={styles.featureVisual}>
                    <AgentSupportVisual />
                  </div>
                ) : null}

                {visualKind === "digests" ? (
                  <div className={styles.featureVisual}>
                    <DigestFeatureVisual />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}

      <section
        ref={howItWorks.ref}
        className={`${styles.howSection} ${howItWorks.isVisible ? styles.visible : ""}`}
      >
        <div className={styles.howInner}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeadline}>How It Works</h2>
            <p className={styles.sectionSubline}>
              Up and running in minutes
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

      <section
        ref={cta.ref}
        className={`${styles.ctaSection} ${cta.isVisible ? styles.visible : ""}`}
      >
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaHeadline}>
            One goal. One plan. An AI that won&apos;t let you forget it.
          </h2>
          <p className={styles.ctaSubline}>
            Set up in minutes. Start moving today.
          </p>
          {isLoggedIn ? (
            <>
              <Link href="/home" className={styles.ctaButton}>
                Go to Dashboard
              </Link>
              <p className={styles.ctaLogin}>
                Or jump back into{" "}
                <Link href="/chat" className={styles.ctaLoginLink}>
                  chat
                </Link>{" "}
                whenever you want agent support.
              </p>
            </>
          ) : (
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
