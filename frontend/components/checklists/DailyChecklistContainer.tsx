"use client";

import { useState, useEffect } from "react";
import {
  DailyChecklist,
  DailyChecklistConfig as ConfigType,
} from "@/types/dailyChecklist";
import { Goal } from "@/types/goal";
import DailyChecklistItem from "./DailyChecklistItem";
import DailyChecklistConfig from "./DailyChecklistConfig";
import { IoChevronDown, IoRefresh, IoSettings } from "@/components/icons";
import {
  fetchTodayChecklist,
  generateDailyChecklist,
  toggleDailyItem,
  deleteDailyItem,
  fetchDailyChecklistConfig,
  updateDailyChecklistConfig,
  reorderTodayChecklistItems,
} from "@/services/dailyChecklistService";
import { buildDirectionalOrder } from "@/lib/anchoredReorder";
import styles from "./dailyChecklist.module.css";

interface DailyChecklistContainerProps {
  goals: Goal[];
  linkedToggle?: { checklistId: number; completed: boolean } | null;
  onLinkedItemToggled?: (parentChecklistId: number, completed: boolean) => void;
}

export default function DailyChecklistContainer({
  goals,
  linkedToggle,
  onLinkedItemToggled,
}: DailyChecklistContainerProps) {
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [config, setConfig] = useState<ConfigType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [todayChecklist, configData] = await Promise.all([
        fetchTodayChecklist(),
        fetchDailyChecklistConfig(),
      ]);
      setChecklist(todayChecklist);
      setConfig(configData);
    } catch (err) {
      console.error("Failed to load daily checklist:", err);
      setError("Failed to load daily plan. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mirror linked goal toggle into daily items locally
  useEffect(() => {
    if (!linkedToggle) return;
    const { checklistId, completed } = linkedToggle;
    setChecklist((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.parentChecklistId === checklistId
                ? {
                    ...item,
                    completed,
                    completedAt: completed ? new Date().toISOString() : undefined,
                  }
                : item
            ),
          }
        : current
    );
  }, [linkedToggle]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDailyChecklist();
      setChecklist(result);
    } catch (err: unknown) {
      console.error("Failed to generate daily checklist:", err);
      const message =
        err instanceof Error ? err.message : "Failed to generate daily plan.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = async (dailyItemId: number) => {
    if (!checklist) return;
    try {
      const updated = await toggleDailyItem(dailyItemId);
      setChecklist({
        ...checklist,
        items: checklist.items.map((item) =>
          item.dailyItemId === dailyItemId ? updated : item
        ),
      });
      // If this daily item is linked to a goal checklist item, notify parent
      const toggledItem = checklist.items.find((i) => i.dailyItemId === dailyItemId);
      if (toggledItem?.parentChecklistId && onLinkedItemToggled) {
        onLinkedItemToggled(toggledItem.parentChecklistId, updated.completed);
      }
    } catch (err) {
      console.error("Failed to toggle item:", err);
    }
  };

  const handleDelete = async (dailyItemId: number) => {
    if (!checklist) return;
    try {
      await deleteDailyItem(dailyItemId);
      setChecklist({
        ...checklist,
        items: checklist.items.filter(
          (item) => item.dailyItemId !== dailyItemId
        ),
      });
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleReorder = async (dailyItemId: number, direction: -1 | 1) => {
    if (!checklist) return;
    const orderedItemIds = buildDirectionalOrder(
      checklist.items,
      dailyItemId,
      direction,
      (item) => item.dailyItemId
    );
    if (!orderedItemIds) return;

    try {
      const updated = await reorderTodayChecklistItems({ orderedItemIds });
      setChecklist(updated);
    } catch (err) {
      console.error("Failed to reorder daily items:", err);
      setError("Could not reorder daily plan items. Please try again.");
    }
  };

  const handleSaveConfig = async (
    data: Parameters<typeof updateDailyChecklistConfig>[0]
  ) => {
    const updated = await updateDailyChecklistConfig(data);
    setConfig(updated);
  };

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderInfo}>
            <h2 className={styles.cardTitle}>Daily Plan</h2>
          </div>
        </div>
        <div className={styles.loadingBody}>
          <div className={styles.spinner} />
          <span>Loading daily plan...</span>
        </div>
      </div>
    );
  }

  const completedCount = checklist?.items.filter((i) => i.completed).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const dateLabel = checklist
    ? new Date(checklist.planDate + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    : "Today";

  return (
    <div className={styles.card}>
      {/* Card header — matches goal checklist card header */}
      <div
        className={styles.cardHeader}
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ cursor: "pointer" }}
      >
        <div className={styles.cardHeaderInfo}>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>
              Daily Plan{checklist ? ` — ${dateLabel}` : ""}
            </h2>
            <div className={styles.cardTitleActions}>
              {config && (
                <button
                  className={styles.settingsButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfig(!showConfig);
                    if (!isCollapsed && !showConfig) return;
                    if (isCollapsed) setIsCollapsed(false);
                  }}
                  aria-label="Daily plan settings"
                >
                  <IoSettings size={16} />
                </button>
              )}
              {checklist && checklist.generationCount < 2 && (
                <button
                  className={styles.settingsButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleGenerate();
                  }}
                  aria-label="Regenerate daily plan"
                  title={isGenerating ? "Regenerating daily plan" : "Regenerate daily plan"}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <div className={styles.inlineSpinner} aria-hidden="true" />
                  ) : (
                    <IoRefresh size={16} />
                  )}
                </button>
              )}
              <span
                className={`${styles.collapseIcon} ${isCollapsed ? styles.collapseIconCollapsed : ""}`}
              >
                <IoChevronDown size={18} />
              </span>
            </div>
          </div>
          {checklist && (
            <div className={styles.progressRow}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className={styles.progressText}>
                {completedCount} of {totalCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible body */}
      {!isCollapsed && (
        <>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {isGenerating && checklist && (
            <div className={styles.statusBanner} aria-live="polite">
              <div className={styles.inlineSpinner} />
              <span>Regenerating today&apos;s plan...</span>
            </div>
          )}

          {/* Config panel — expands inside card */}
          {showConfig && config && (
            <DailyChecklistConfig
              config={config}
              goals={goals}
              onSave={handleSaveConfig}
            />
          )}

          {!checklist ? (
            /* Empty state — no plan yet */
            <div className={styles.emptyBody}>
              <p className={styles.emptyText}>
                Generate a daily plan tailored to your goals, routines, and the
                time of day.
              </p>
              <button
                className={styles.generateButton}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className={styles.spinnerSmall} />
                    Generating...
                  </>
                ) : (
                  <>
                  
                    Generate Daily Plan
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Items list */
            <div className={styles.itemsList}>
              {checklist.items.map((item) => {
                const itemIndex = checklist.items.findIndex(
                  (entry) => entry.dailyItemId === item.dailyItemId
                );
                return (
                  <DailyChecklistItem
                    key={item.dailyItemId}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onMoveUp={!item.scheduledTime ? () => void handleReorder(item.dailyItemId, -1) : undefined}
                    onMoveDown={!item.scheduledTime ? () => void handleReorder(item.dailyItemId, 1) : undefined}
                    canMoveUp={!item.scheduledTime && itemIndex > 0}
                    canMoveDown={!item.scheduledTime && itemIndex < checklist.items.length - 1}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
