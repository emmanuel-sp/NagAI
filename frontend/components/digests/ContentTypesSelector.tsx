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
      value: "nearby_opportunities",
      label: "Nearby Opportunities",
      description: "Local events, resources, and opportunities relevant to your goals",
    },
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
  ];

  return (
    <>
      <div className={styles.settingsCard}>
        <h2 className={styles.cardTitle}>Content Types</h2>
        <p className={styles.cardSubtitle}>
          Choose what types of content you&apos;d like to receive in your digest
        </p>

        <div className={styles.contentTypeGrid}>
          {contentTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onToggleType(type.value)}
              className={`${styles.contentTypeCard} ${
                safeSelected.includes(type.value) ? styles.contentTypeCardActive : ""
              }`}
            >
              <div className={styles.contentTypeHeader}>
                <span className={styles.contentTypeLabel}>{type.label}</span>
              </div>
              <p className={styles.contentTypeDescription}>{type.description}</p>
            </button>
          ))}
        </div>

        <div className={styles.previewTriggerRow}>
          <button
            type="button"
            className={styles.previewTrigger}
            onClick={() => setPreviewOpen(true)}
            disabled={safeSelected.length === 0}
          >
            <IoEye size={16} />
            Preview Digest
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
