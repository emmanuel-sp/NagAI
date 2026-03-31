"use client";

import { useEffect, useRef, useState } from "react";
import { IoSave } from "@/components/icons";
import styles from "./goalJournal.module.css";

interface GoalJournalCardProps {
  value?: string | null;
  onSave: (markdown: string) => Promise<void>;
}

type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string };

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const value = match[0];
    if (value.startsWith("**")) {
      tokens.push({ type: "strong", value: value.slice(2, -2) });
    } else {
      tokens.push({ type: "em", value: value.slice(1, -1) });
    }
    lastIndex = index + value.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

function renderInline(text: string) {
  return parseInlineTokens(text).map((token, index) => {
    if (token.type === "strong") {
      return <strong key={`${token.value}-${index}`}>{token.value}</strong>;
    }
    if (token.type === "em") {
      return <em key={`${token.value}-${index}`}>{token.value}</em>;
    }
    return token.value;
  });
}

function renderMarkdown(markdown: string) {
  const lines = markdown.split("\n");

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={`space-${index}`} className={styles.previewSpacer} />;
    }

    if (trimmed.startsWith("### ")) {
      return <h4 key={`h3-${index}`} className={styles.previewHeadingSm}>{renderInline(trimmed.slice(4))}</h4>;
    }

    if (trimmed.startsWith("## ")) {
      return <h3 key={`h2-${index}`} className={styles.previewHeadingMd}>{renderInline(trimmed.slice(3))}</h3>;
    }

    if (trimmed.startsWith("# ")) {
      return <h2 key={`h1-${index}`} className={styles.previewHeadingLg}>{renderInline(trimmed.slice(2))}</h2>;
    }

    if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ")) {
      const checked = trimmed.startsWith("- [x] ");
      return (
        <div key={`check-${index}`} className={styles.previewChecklistRow}>
          <span className={`${styles.previewCheckbox} ${checked ? styles.previewCheckboxChecked : ""}`}>
            {checked ? "x" : ""}
          </span>
          <span>{renderInline(trimmed.slice(6))}</span>
        </div>
      );
    }

    if (trimmed.startsWith("- ")) {
      return (
        <div key={`bullet-${index}`} className={styles.previewBulletRow}>
          <span className={styles.previewBullet}>•</span>
          <span>{renderInline(trimmed.slice(2))}</span>
        </div>
      );
    }

    return (
      <p key={`paragraph-${index}`} className={styles.previewParagraph}>
        {renderInline(trimmed)}
      </p>
    );
  });
}

export default function GoalJournalCard({ value = "", onSave }: GoalJournalCardProps) {
  const normalizedValue = value ?? "";
  const [draft, setDraft] = useState(normalizedValue);
  const [view, setView] = useState<"write" | "preview">("write");
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  useEffect(() => {
    if (!draft.trim() && view === "preview") {
      setView("write");
    }
  }, [draft, view]);

  const updateSelection = (
    nextValue: string,
    selectionStart: number,
    selectionEnd: number
  ) => {
    setDraft(nextValue);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const wrapSelection = (prefix: string, suffix = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draft.slice(start, end);
    const insertion = `${prefix}${selected}${suffix}`;
    const nextValue = `${draft.slice(0, start)}${insertion}${draft.slice(end)}`;
    const cursorStart = start + prefix.length;
    const cursorEnd = start + prefix.length + selected.length;
    updateSelection(nextValue, cursorStart, cursorEnd);
  };

  const prefixLines = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draft.slice(start, end);
    const source = selected || "";
    const nextSelected = source
      ? source.split("\n").map((line) => `${prefix}${line}`).join("\n")
      : prefix;
    const nextValue = `${draft.slice(0, start)}${nextSelected}${draft.slice(end)}`;
    const cursor = start + nextSelected.length;
    updateSelection(nextValue, cursor, cursor);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState("idle");
    try {
      await onSave(draft);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setIsSaving(false);
    }
  };

  const hasContent = draft.trim().length > 0;
  const isDirty = draft !== normalizedValue;
  const statusMessage =
    saveState === "saved"
      ? "Saved"
      : saveState === "error"
        ? "Could not save. Try again."
        : isDirty
          ? "Unsaved"
          : "";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Journal</h2>
          <p className={styles.subtitle}>
            A private markdown note for your own planning. It is not automatically used by the agent.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewButton} ${view === "write" ? styles.viewButtonActive : ""}`}
              onClick={() => setView("write")}
            >
              Write
            </button>
            <button
              type="button"
              className={`${styles.viewButton} ${view === "preview" ? styles.viewButtonActive : ""}`}
              onClick={() => setView("preview")}
              disabled={!hasContent}
            >
              Preview
            </button>
          </div>
          <button
            type="button"
            className={styles.saveButton}
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            <IoSave size={14} />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <button type="button" className={styles.toolbarButton} onClick={() => prefixLines("# ")}>H1</button>
        <button type="button" className={styles.toolbarButton} onClick={() => prefixLines("## ")}>H2</button>
        <button type="button" className={styles.toolbarButton} onClick={() => wrapSelection("**")}>Bold</button>
        <button type="button" className={styles.toolbarButton} onClick={() => wrapSelection("*")}>Italic</button>
        <button type="button" className={styles.toolbarButton} onClick={() => prefixLines("- ")}>Bullet</button>
        <button type="button" className={styles.toolbarButton} onClick={() => prefixLines("- [ ] ")}>Checklist</button>
      </div>

      {view === "write" ? (
        <textarea
          ref={textareaRef}
          className={styles.editor}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSaveState("idle");
          }}
          placeholder={"Capture ideas, obstacles, decisions, and notes for this goal.\n\nTry markdown like:\n# Weekly focus\n- Key win\n- [ ] Next step"}
          rows={16}
          maxLength={20000}
        />
      ) : (
        <div className={styles.preview}>
          {draft.trim() ? renderMarkdown(draft) : (
            <p className={styles.previewEmpty}>Nothing here yet. Switch to write mode to start your goal journal.</p>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.helperText}>Formatting supported: headings, bold, italics, bullet lists, and markdown checklists.</span>
        {statusMessage && (
          <span
            className={`${styles.saveState} ${
              saveState === "saved"
                ? styles.saveStateSaved
                : saveState === "error"
                  ? styles.saveStateError
                  : styles.saveStateDirty
            }`}
          >
            {statusMessage}
          </span>
        )}
      </div>
    </div>
  );
}
