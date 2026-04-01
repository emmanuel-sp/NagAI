/** ContentTypesSelector Component - Select content types for digest */
"use client";

import { useState } from "react";
import { DigestContentType } from "@/types/digest";
import { IoEye } from "@/components/icons";
import DigestPreview from "./DigestPreview";
import styles from "./digest-builder.module.css";

interface ContentTypesSelectorProps {
  selectedTypes: DigestContentType[];
  onToggleType: (type: DigestContentType) => void;
}

export default function ContentTypesSelector({
  selectedTypes = [],
  onToggleType,
}: ContentTypesSelectorProps) {
  const safeSelected = selectedTypes ?? [];
  const [previewOpen, setPreviewOpen] = useState(false);

  const contentTypes: { value: DigestContentType; label: string; description: string }[] = [
    {
      value: "affirmations",
      label: "Affirmations",
      description: "Personalized positive affirmations to boost motivation",
    },
    {
      value: "news",
      label: "Curated News",
      description: "News articles and updates related to your interests",
    },
    {
      value: "knowledge_snippets",
      label: "Knowledge Snippets",
      description: "Bite-sized learning content on topics you care about",
    },
    {
      value: "tips",
      label: "Practical Tips",
      description: "Actionable advice to help you progress toward your goals",
    },
    {
      value: "motivational_quotes",
      label: "Motivational Quotes",
      description: "Inspiring quotes tailored to your journey",
    },
    {
      value: "resource_recommendations",
      label: "Resource Recommendations",
      description: "Books, articles, courses, and tools to support your growth",
    },
    {
      value: "progress_insights",
      label: "Progress Insights",
      description: "Analysis of your achievements and areas for improvement",
    },
    {
      value: "reflection_prompts",
      label: "Reflection Prompts",
      description: "Guided questions to reflect on your progress and mindset",
    },
  ];

  return (
    <>
      <div className={styles.settingsCard}>
        <h2 className={styles.cardTitle}>Content Types</h2>
        <p className={styles.cardSubtitle}>
          Choose the mix you want to read, without turning the digest into noise.
        </p>

        <div className={styles.contentTypeGrid}>
          {contentTypes.map((type) => {
            const isSelected = safeSelected.includes(type.value);
            const atLimit = safeSelected.length >= 5 && !isSelected;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => !atLimit && onToggleType(type.value)}
                disabled={atLimit}
                aria-pressed={isSelected}
                className={`${styles.contentTypeCard} ${
                  isSelected ? styles.contentTypeCardActive : ""
                } ${atLimit ? styles.contentTypeCardDisabled : ""}`}
              >
                <div className={styles.contentTypeHeader}>
                  <span className={styles.contentTypeLabel}>{type.label}</span>
                  <span className={styles.checkmark} aria-hidden="true">
                    {isSelected ? "✓" : ""}
                  </span>
                </div>
                <p className={styles.contentTypeDescription}>{type.description}</p>
              </button>
            );
          })}
        </div>

        {safeSelected.length >= 5 && (
          <p className={styles.contentTypeLimitHint}>
            Maximum of 5 content types selected
          </p>
        )}

        <div className={styles.previewTriggerRow}>
          <button
            type="button"
            className={styles.previewTrigger}
            onClick={() => setPreviewOpen(true)}
            disabled={safeSelected.length === 0}
          >
            <IoEye size={16} />
            Preview sample digest
          </button>
        </div>
      </div>

      <DigestPreview
        selectedTypes={safeSelected}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
