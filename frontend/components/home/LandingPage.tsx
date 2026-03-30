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
    label: "SMART GOAL DESIGN",
    title: "Define sharper goals with AI-assisted SMART guidance",
    description:
      "NagAI helps turn vague intentions into specific, measurable goals so you start with a target worth acting on instead of a nice idea.",
    bullets: [
      "AI suggests SMART fields one piece at a time",
      "Profile context makes the guidance more relevant to your actual life",
      "A clearer goal becomes the foundation for better execution",
    ],
  },
  {
    id: "daily-plan",
    label: "DAILY PLAN",
    title: "Turn the bigger plan into a day you can actually execute",
    description:
      "NagAI can turn your goals, checklist progress, and routines into a focused daily plan so the system helps you act today instead of just organizing tomorrow.",
    bullets: [
      "Build a day around priorities, routines, and realistic focus blocks",
      "Pull execution forward from the goal and checklist work already in motion",
      "Keep the plan useful and lightweight instead of auto-filling every hour",
    ],
  },
  {
    id: "chat-support",
    label: "CHAT SUPPORT",
    title: "Talk to the agent when you need clarity, coaching, or a next move",
    description:
      "Use chat to figure out new goals through quiz-style conversation, stay on track with checklist work, or continue the thread after an agent nag needs a real response.",
    bullets: [
      "Use guided prompts to narrow vague intentions into real goals",
      "Ask for help when a checklist item gets fuzzy or blocked",
      "Continue from agent nags when a reminder turns into an actual conversation",
    ],
  },
  {
    id: "digests",
    label: "DIGESTS",
    title: "Get curated support content you can actually read and use",
    description:
      "Digests deliver personalized reading and reinforcement around the themes you care about, so support arrives as something useful to absorb rather than another nag.",
    bullets: [
      "Choose the kinds of content you want included in your digest",
      "Receive lightweight motivation, insights, and practical reading tied to your interests",
      "Keep digests distinct from agent nags, which are proactive check-ins instead of curated content",
    ],
  },
];

const steps = [
  {
    number: "1",
    title: "Add just enough context",
    text: "Profile details give the AI richer context, without becoming the whole story.",
  },
  {
    number: "2",
    title: "Define a real goal",
    text: "Use AI guidance to make the goal concrete enough to act on.",
  },
  {
    number: "3",
    title: "Work the plan for today",
    text: "Let the system shape a daily plan from the goals and checklist work already in motion.",
  },
  {
    number: "4",
    title: "Stay reinforced over time",
    text: "Use chat for real support, let nags prompt follow-up, and read digests for curated reinforcement.",
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
          <p className={styles.heroEyebrow}>AI accountability for real goals</p>
          <h1 className={styles.headline}>
            Define better goals.
            <br />
            <span className={styles.headlineAccent}>
              <em>Get the next actions.</em>
            </span>
          </h1>
          <p className={styles.subline}>
            NagAI helps you turn a goal into focused next steps, shape the day
            around what matters, and stay supported with chat, nags, and
            curated digests when you need reinforcement.
          </p>
          <div className={styles.heroMeta}>
            <span>Profile context makes planning richer</span>
            <span>Goals can become a usable daily plan</span>
            <span>Chat and digests support follow-through differently</span>
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
                <Link href="/goals" className={styles.secondaryCta}>
                  Open Goal Hub
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
              Start with a real goal and watch it turn into something you can act
              on immediately.
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
              A focused path from ambition to execution
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
            Start with one goal and let the system do the hard part
          </h2>
          <p className={styles.ctaSubline}>
            Build a sharper target, generate the next actions, and lean on the
            agent when you need help staying in motion.
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
