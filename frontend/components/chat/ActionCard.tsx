"use client";

import { useState } from "react";
import { ActionSuggestion } from "@/types/chat";
import { createGoal } from "@/services/goalService";
import { updateGoal } from "@/services/goalService";
import { createChecklistItem, toggleChecklistItem } from "@/services/checklistService";
import { updateSuggestionStatus } from "@/services/chatService";
import styles from "./ActionCard.module.css";

interface ActionCardProps {
  suggestion: ActionSuggestion;
  messageId: number;
  onStatusChange: (suggestionId: string, status: "accepted" | "rejected") => void;
  onDataRefresh: () => void;
}

const TYPE_CONFIG: Record<
  ActionSuggestion["type"],
  { label: string }
> = {
  create_goal: { label: "New Goal" },
  update_goal: { label: "Update Goal" },
  add_checklist_item: { label: "Add Item" },
  complete_checklist_item: { label: "Complete Item" },
  quiz: { label: "Quiz" },
};

export default function ActionCard({
  suggestion,
  messageId,
  onStatusChange,
  onDataRefresh,
}: ActionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = TYPE_CONFIG[suggestion.type] || { label: "Action" };
  const params = JSON.parse(suggestion.paramsJson);
  const isDone = suggestion.status === "accepted" || suggestion.status === "rejected";

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await executeAction(suggestion.type, params);
      await updateSuggestionStatus(messageId, suggestion.suggestionId, "accepted");
      onStatusChange(suggestion.suggestionId, "accepted");
      onDataRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await updateSuggestionStatus(messageId, suggestion.suggestionId, "rejected");
      onStatusChange(suggestion.suggestionId, "rejected");
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${styles.card} ${isDone ? styles.cardDone : ""} ${
        suggestion.status === "rejected" ? styles.cardRejected : ""
      }`}
    >
      <div className={styles.header}>
        <span className={styles.label}>{config.label}</span>
        {suggestion.status === "accepted" && (
          <span className={styles.statusBadge}>Accepted</span>
        )}
        {suggestion.status === "rejected" && (
          <span className={`${styles.statusBadge} ${styles.statusRejected}`}>
            Dismissed
          </span>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.displayText}>{suggestion.displayText}</p>
        {suggestion.type === "create_goal" && params.checklist_items?.length > 0 && (
          <ul className={styles.subItems}>
            {params.checklist_items.map(
              (item: { title: string }, i: number) => (
                <li key={i}>{item.title}</li>
              )
            )}
          </ul>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!isDone && (
        <div className={styles.actions}>
          <button
            className={styles.acceptBtn}
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "..." : "Accept"}
          </button>
          <button
            className={styles.rejectBtn}
            onClick={handleReject}
            disabled={loading}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

async function executeAction(
  type: ActionSuggestion["type"],
  params: Record<string, unknown>
) {
  switch (type) {
    case "create_goal": {
      const goal = await createGoal({
        title: params.title as string,
        description: (params.description as string) || "",
        targetDate: (params.targetDate as string) || "",
        specific: (params.specific as string) || undefined,
        measurable: (params.measurable as string) || undefined,
        attainable: (params.attainable as string) || undefined,
        relevant: (params.relevant as string) || undefined,
        timely: (params.timely as string) || undefined,
      });
      // If checklist items were included, create them for the new goal
      const items = params.checklist_items as { title: string }[] | undefined;
      if (items?.length) {
        for (const item of items) {
          await createChecklistItem({
            goalId: goal.goalId,
            title: item.title,
          });
        }
      }
      break;
    }
    case "update_goal": {
      const updates = params.updates as Record<string, string>;
      await updateGoal(params.goalId as number, {
        goalId: params.goalId as number,
        ...updates,
      });
      break;
    }
    case "add_checklist_item": {
      await createChecklistItem({
        goalId: params.goalId as number,
        title: params.title as string,
        notes: (params.notes as string) || undefined,
      });
      break;
    }
    case "complete_checklist_item": {
      await toggleChecklistItem(params.checklistId as number);
      break;
    }
  }
}
