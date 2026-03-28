"use client";

import styles from "./chat.module.css";

interface PresetPromptsProps {
  onSelect: (text: string) => void;
}

const PRESETS = [
  {
    icon: "◆",
    label: "Help me define a goal",
    prompt:
      "I'd like help defining a new goal. Can you walk me through making it SMART?",
  },
  {
    icon: "◎",
    label: "Review my progress",
    prompt:
      "Can you review my current goals and checklist progress? Let me know where I stand and what to focus on.",
  },
  {
    icon: "▸",
    label: "What should I focus on today?",
    prompt:
      "Based on my goals and checklists, what should I prioritize today?",
  },
  {
    icon: "✦",
    label: "Suggest next steps",
    prompt:
      "Look at my active goals and suggest concrete next steps I should take.",
  },
];

export default function PresetPrompts({ onSelect }: PresetPromptsProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyGlow} />
      <h2 className={styles.emptyTitle}>How can I help?</h2>
      <p className={styles.emptySubtitle}>
        Ask me anything about your goals, or try a suggestion below.
      </p>
      <div className={styles.presetGrid}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={styles.presetCard}
            onClick={() => onSelect(preset.prompt)}
          >
            <span className={styles.presetIcon}>{preset.icon}</span>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
