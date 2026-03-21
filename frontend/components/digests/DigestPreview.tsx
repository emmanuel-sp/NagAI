/** DigestPreview — Modal showing a hardcoded example digest based on selected content types */
"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { DigestContentType } from "@/types/digest";
import { useModal } from "@/contexts/ModalContext";
import { IoClose } from "@/components/icons";
import styles from "./digest-builder.module.css";

interface DigestPreviewProps {
  selectedTypes: DigestContentType[];
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEW_CONTENT: Record<DigestContentType, { label: string; content: string }> = {
  affirmations: {
    label: "Daily Affirmation",
    content:
      "You are capable of achieving your goals one step at a time. Every action you take today brings you closer to who you\u2019re becoming. Trust the process \u2014 growth isn\u2019t always visible in the moment, but it\u2019s happening. You\u2019ve already proven you can show up, and that\u2019s the hardest part.",
  },
  news: {
    label: "In the News",
    content:
      "A new longitudinal study from Stanford found that people who track their goals weekly are 42% more likely to achieve them than those who only set goals annually. Researchers attribute this to the \u201cfeedback loop effect\u201d \u2014 frequent check-ins keep motivation fresh and allow for course correction before habits stall. \u2014 Science Daily",
  },
  knowledge_snippets: {
    label: "Knowledge Snippet",
    content:
      "The Pareto Principle: 80% of your results come from 20% of your efforts. Originally observed by economist Vilfredo Pareto in 1896, this pattern appears everywhere \u2014 from business revenue to personal productivity. Try auditing your last week: which activities moved the needle most? Double down on those and consider delegating or dropping the rest.",
  },
  tips: {
    label: "Tip of the Day",
    content:
      "Break your biggest goal into 3 micro-tasks for today. Research shows that specificity dramatically increases follow-through \u2014 \u201cwrite for 15 minutes\u201d beats \u201cwork on my book.\u201d Starting small removes friction and builds momentum toward lasting change. Bonus: crossing off small wins triggers dopamine, making you more likely to keep going.",
  },
  motivational_quotes: {
    label: "Quote",
    content:
      "\u201cThe secret of getting ahead is getting started. The secret of getting started is breaking your complex, overwhelming tasks into small manageable tasks, and then starting on the first one.\u201d \u2014 Mark Twain",
  },
  resource_recommendations: {
    label: "Resource Pick",
    content:
      "Atomic Habits by James Clear \u2014 A practical framework for building good habits through small, consistent changes that compound over time. Clear introduces the \u201c1% better every day\u201d philosophy and provides a four-step model (cue, craving, response, reward) for designing habits that stick. Highly recommended if you\u2019re building new routines around your goals.",
  },
  progress_insights: {
    label: "Your Progress",
    content:
      "Great week \u2014 you\u2019ve completed 7 of 10 checklist items, putting you at 70% completion. That\u2019s up from 55% last week. At this pace, you\u2019ll finish your current goal about 2 weeks ahead of schedule. Your strongest streak is 5 consecutive days of activity. Keep it going \u2014 consistency is your biggest advantage right now.",
  },
  reflection_prompts: {
    label: "Reflect",
    content:
      "What\u2019s one thing you did this week that moved you closer to your goal \u2014 even if it felt small? Sometimes the steps that feel insignificant in the moment are the ones that compound the most. Take a minute to write down what worked, what didn\u2019t, and what you\u2019d do differently next week.",
  },
};

export default function DigestPreview({ selectedTypes, isOpen, onClose }: DigestPreviewProps) {
  const { registerModal } = useModal();

  useEffect(() => {
    if (!isOpen) return;
    registerModal(true);
    return () => registerModal(false);
  }, [isOpen, registerModal]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const safeSelected = selectedTypes ?? [];

  const modal = (
    <div className={styles.previewModalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.previewModalContent}>
        <div className={styles.previewModalHeader}>
          <div>
            <h2 className={styles.previewModalTitle}>Digest Preview</h2>
            <p className={styles.previewModalSubtitle}>
              Example with {safeSelected.length} content{" "}
              {safeSelected.length === 1 ? "type" : "types"} selected
            </p>
          </div>
          <div className={styles.previewModalActions}>
            <span className={styles.previewBadge}>Example</span>
            <button
              type="button"
              className={styles.previewModalCloseButton}
              onClick={onClose}
            >
              <IoClose size={16} />
            </button>
          </div>
        </div>

        <div className={styles.previewModalBody}>
          <div className={styles.previewEmail}>
            <div className={styles.previewEmailHeader}>
              <span className={styles.previewEmailBrand}>NagAI</span>
              <span className={styles.previewEmailMeta}>
                <span className={styles.previewEmailDot} />
                Today &middot; 8:00 AM
              </span>
            </div>

            <div className={styles.previewEmailGreeting}>
              Good morning &mdash; here&apos;s what we have for you today.
            </div>

            <div className={styles.previewSections}>
              {safeSelected.map((type, i) => {
                const item = PREVIEW_CONTENT[type];
                if (!item) return null;
                return (
                  <div
                    key={type}
                    className={styles.previewSection}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className={styles.previewSectionLabel}>{item.label}</span>
                    <p className={styles.previewSectionContent}>{item.content}</p>
                  </div>
                );
              })}
            </div>

            <div className={styles.previewEmailFooter}>
              Your NagAI Digest &middot; Personalized for you
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
