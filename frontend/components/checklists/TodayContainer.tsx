"use client";

import { useState, useEffect } from "react";
import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSearchParams, useRouter } from "next/navigation";
import {
  DailyChecklist,
  DailyChecklistBusyBlock,
  DailyChecklistItem as DailyItem,
  DailyChecklistConfig as ConfigType,
} from "@/types/dailyChecklist";
import { Goal } from "@/types/goal";
import DailyChecklistConfig from "./DailyChecklistConfig";
import {
  IoSparkles,
  IoSettings,
  IoAdd,
  IoClock,
  IoTrash,
  IoPencil,
  IoCheckmarkCircle,
  IoEllipseOutline,
  IoClose,
  IoCheck,
  IoChevronUp,
  IoChevronDown,
  IoListOutline,
  IoCalendarOutline,
  IoRefresh,
  IoMenuOutline,
} from "@/components/icons";
import { buildDirectionalOrder, buildDraggedOrder } from "@/lib/anchoredReorder";
import {
  fetchTodayChecklist,
  generateDailyChecklist,
  toggleDailyItem,
  deleteDailyItem,
  fetchDailyChecklistConfig,
  updateDailyChecklistConfig,
  addDailyItem,
  updateDailyItem,
  reorderTodayChecklistItems,
} from "@/services/dailyChecklistService";
import { fetchGoals } from "@/services/goalService";
import styles from "./today.module.css";

type ViewMode = "list" | "hourly";

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function busyBlockKey(busyBlock: DailyChecklistBusyBlock, index: number): string {
  return `${busyBlock.startTime}-${busyBlock.endTime}-${busyBlock.summary || "busy"}-${index}`;
}

// ─── Edit Form ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  item: DailyItem;
  onSave: (id: number, updates: { title: string; notes?: string; scheduledTime?: string | null }) => Promise<void>;
  onCancel: () => void;
}

function EditForm({ item, onSave, onCancel }: EditFormProps) {
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [time, setTime] = useState(item.scheduledTime ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(item.dailyItemId, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        scheduledTime: time || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <input
        className={styles.editInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Item title"
        autoFocus
        maxLength={200}
      />
      <div className={styles.editRow}>
        <input
          className={styles.editTimeInput}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Time"
        />
        <textarea
          className={styles.editTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          maxLength={500}
        />
      </div>
      <div className={styles.editActions}>
        <button
          type="submit"
          className={styles.editSaveBtn}
          disabled={!title.trim() || saving}
        >
          <IoCheck size={13} />
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" className={styles.editCancelBtn} onClick={onCancel}>
          <IoClose size={13} />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Add Form ──────────────────────────────────────────────────────────────────

interface AddFormProps {
  onAdd: (data: { title: string; notes?: string; scheduledTime?: string }) => Promise<void>;
  onCancel: () => void;
}

function AddForm({ onAdd, onCancel }: AddFormProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        title: title.trim(),
        notes: notes.trim() || undefined,
        scheduledTime: time || undefined,
      });
    } catch {
      setError("Failed to add item.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.addForm}>
      {error && <div className={styles.addFormError}>{error}</div>}
      <input
        className={styles.editInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New item title..."
        autoFocus
        maxLength={200}
      />
      <div className={styles.editRow}>
        <input
          className={styles.editTimeInput}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <textarea
          className={styles.editTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          maxLength={500}
        />
      </div>
      <div className={styles.editActions}>
        <button
          type="submit"
          className={styles.editSaveBtn}
          disabled={!title.trim() || saving}
        >
          <IoAdd size={13} />
          {saving ? "Adding..." : "Add item"}
        </button>
        <button type="button" className={styles.editCancelBtn} onClick={onCancel}>
          <IoClose size={13} />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── List Item ─────────────────────────────────────────────────────────────────

interface ListItemProps {
  item: DailyItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isDraggable: boolean;
  isDragging?: boolean;
  dragHandleAttributes?: any;
  dragHandleListeners?: any;
  onToggle: (id: number) => void;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
}

function ListItemRow({
  item,
  canMoveUp,
  canMoveDown,
  isDraggable,
  isDragging = false,
  dragHandleAttributes,
  dragHandleListeners,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ListItemProps) {
  return (
    <div
      className={`${styles.listItem} ${item.completed ? styles.listItemCompleted : ""} ${
        isDragging ? styles.listItemDragging : ""
      }`}
    >
      <button
        className={`${styles.itemCheckbox} ${item.completed ? styles.checkboxChecked : styles.checkboxUnchecked}`}
        onClick={() => onToggle(item.dailyItemId)}
        aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
      >
        {item.completed ? (
          <IoCheckmarkCircle size={20} />
        ) : (
          <IoEllipseOutline size={20} />
        )}
      </button>

      <div className={styles.itemContent}>
        <span className={styles.itemTitle}>{item.title}</span>
        {item.notes && <span className={styles.itemNotes}>{item.notes}</span>}
        <div className={styles.itemMeta}>
          {item.scheduledTime && (
            <span className={styles.timeBadge}>
              <IoClock size={11} />
              {formatTime12h(item.scheduledTime)}
            </span>
          )}
          {item.parentGoalTitle && (
            <span className={styles.goalPill}>{item.parentGoalTitle}</span>
          )}
        </div>
      </div>

      <div className={styles.itemActions}>
        {isDraggable && dragHandleAttributes && dragHandleListeners && (
          <button
            type="button"
            className={styles.dragHandle}
            aria-label="Drag item"
            {...dragHandleAttributes}
            {...dragHandleListeners}
          >
            <IoMenuOutline size={13} />
          </button>
        )}
        <button
          className={styles.actionBtn}
          onClick={onEdit}
          aria-label="Edit item"
          title="Edit"
        >
          <IoPencil size={13} />
        </button>
        <div className={styles.reorderBtns}>
          <button
            className={styles.reorderBtn}
            onClick={() => onMoveUp(item.dailyItemId)}
            aria-label="Move up"
            disabled={!canMoveUp}
          >
            <IoChevronUp size={13} />
          </button>
          <button
            className={styles.reorderBtn}
            onClick={() => onMoveDown(item.dailyItemId)}
            aria-label="Move down"
            disabled={!canMoveDown}
          >
            <IoChevronDown size={13} />
          </button>
        </div>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
          onClick={() => onDelete(item.dailyItemId)}
          aria-label="Delete item"
          title="Delete"
        >
          <IoTrash size={13} />
        </button>
      </div>
    </div>
  );
}

interface SortableTodayListRowProps {
  item: DailyItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: (id: number) => void;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
}

function SortableTodayListRow(props: SortableTodayListRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.item.dailyItemId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ListItemRow
        {...props}
        isDraggable={!props.item.scheduledTime}
        isDragging={isDragging}
        dragHandleAttributes={!props.item.scheduledTime ? attributes : undefined}
        dragHandleListeners={!props.item.scheduledTime ? listeners : undefined}
      />
    </div>
  );
}

// ─── Main Container ────────────────────────────────────────────────────────────

export default function TodayContainer() {
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null);
  const [items, setItems] = useState<DailyItem[]>([]);
  const [config, setConfig] = useState<ConfigType | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const calendarParam = searchParams.get("calendar");
    if (calendarParam === "connected") {
      setCalendarNotice("Google Calendar connected! Your next daily plan will schedule around your meetings.");
      router.replace("/today", { scroll: false });
    } else if (calendarParam === "error") {
      setError("Failed to connect Google Calendar. Please try again.");
      router.replace("/today", { scroll: false });
    }
    loadData();
  }, []);

  useEffect(() => {
    if (checklist) setItems([...checklist.items]);
  }, [checklist]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [todayChecklist, configData, goalsData] = await Promise.all([
        fetchTodayChecklist(),
        fetchDailyChecklistConfig(),
        fetchGoals(),
      ]);
      setChecklist(todayChecklist);
      setConfig(configData);
      setGoals(goalsData);
    } catch (err) {
      console.error("Failed to load today:", err);
      setError("Failed to load. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDailyChecklist();
      setChecklist(result);
      setItems(result.items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate plan.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = async (dailyItemId: number) => {
    try {
      const updated = await toggleDailyItem(dailyItemId);
      setItems((prev) => prev.map((i) => (i.dailyItemId === dailyItemId ? updated : i)));
      setChecklist((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) => (i.dailyItemId === dailyItemId ? updated : i)),
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const handleDelete = async (dailyItemId: number) => {
    try {
      await deleteDailyItem(dailyItemId);
      setItems((prev) => prev.filter((i) => i.dailyItemId !== dailyItemId));
      setChecklist((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((i) => i.dailyItemId !== dailyItemId) }
          : prev
      );
      if (editingId === dailyItemId) setEditingId(null);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleEditSave = async (
    id: number,
    updates: { title: string; notes?: string; scheduledTime?: string | null }
  ) => {
    const updated = await updateDailyItem(id, {
      title: updates.title,
      notes: updates.notes,
      scheduledTime: updates.scheduledTime,
    });
    setItems((prev) => prev.map((i) => (i.dailyItemId === id ? updated : i)));
    setChecklist((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) => (i.dailyItemId === id ? updated : i)),
          }
        : prev
    );
    setEditingId(null);
  };

  const handleAdd = async (data: { title: string; notes?: string; scheduledTime?: string }) => {
    const newItem = await addDailyItem(data);
    setItems((prev) => [...prev, newItem]);
    setChecklist((prev) =>
      prev ? { ...prev, items: [...prev.items, newItem] } : prev
    );
    setShowAdd(false);
  };

  const handleReorder = async (id: number, direction: -1 | 1) => {
    const orderedItemIds = buildDirectionalOrder(
      items,
      id,
      direction,
      (item) => item.dailyItemId
    );
    if (!orderedItemIds) return;

    try {
      const updated = await reorderTodayChecklistItems({ orderedItemIds });
      setChecklist(updated);
      setItems(updated.items);
    } catch (err) {
      console.error("Failed to reorder daily items:", err);
      setError("Could not reorder daily plan items. Please try again.");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!event.over) return;

    const activeId = Number(event.active.id);
    const overId = Number(event.over.id);
    const activeItem = items.find((item) => item.dailyItemId === activeId);
    if (!activeItem || activeItem.scheduledTime) return;

    const orderedItemIds = buildDraggedOrder(
      items,
      activeId,
      overId,
      (item) => item.dailyItemId
    );
    if (!orderedItemIds) return;

    try {
      const updated = await reorderTodayChecklistItems({ orderedItemIds });
      setChecklist(updated);
      setItems(updated.items);
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

  // ─── List view ───────────────────────────────────────────────────────────────

  const renderListRows = () =>
    items.map((item, index) =>
      editingId === item.dailyItemId ? (
        <EditForm
          key={item.dailyItemId}
          item={item}
          onSave={handleEditSave}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <SortableTodayListRow
          key={item.dailyItemId}
          item={item}
          canMoveUp={!item.scheduledTime && index > 0}
          canMoveDown={!item.scheduledTime && index < items.length - 1}
          onToggle={handleToggle}
          onEdit={() => {
            setShowAdd(false);
            setEditingId(item.dailyItemId);
          }}
          onDelete={handleDelete}
          onMoveUp={(dailyItemId) => void handleReorder(dailyItemId, -1)}
          onMoveDown={(dailyItemId) => void handleReorder(dailyItemId, 1)}
        />
      )
    );

  const renderListView = () => {
    const isDragEnabled = editingId === null && !showAdd;

    return (
      <div className={styles.listView}>
        {isDragEnabled ? (
          <DndContext sensors={sensors} onDragEnd={(event) => void handleDragEnd(event)}>
            <SortableContext
              items={items.map((item) => item.dailyItemId)}
              strategy={verticalListSortingStrategy}
            >
              {renderListRows()}
            </SortableContext>
          </DndContext>
        ) : (
          renderListRows()
        )}

        {showAdd ? (
          <AddForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
        ) : (
          <button
            className={styles.addItemBtn}
            onClick={() => {
              setEditingId(null);
              setShowAdd(true);
            }}
          >
            <IoAdd size={14} />
            Add item
          </button>
        )}
      </div>
    );
  };

  // ─── Hourly view ─────────────────────────────────────────────────────────────

  const renderHourlyView = () => {
    const busyBlocks = checklist?.busyBlocks ?? [];
    const scheduled = items
      .filter((i) => i.scheduledTime)
      .sort((a, b) => timeToMinutes(a.scheduledTime!) - timeToMinutes(b.scheduledTime!));
    const unscheduled = items.filter((i) => !i.scheduledTime);

    type HourlyEntry =
      | { kind: "item"; startMinutes: number; item: DailyItem }
      | { kind: "busy"; startMinutes: number; busyBlock: DailyChecklistBusyBlock; key: string };

    const busyHours = busyBlocks.flatMap((block) => [
      parseInt(block.startTime.split(":")[0], 10),
      parseInt(block.endTime.split(":")[0], 10),
    ]);
    const hours = [
      ...scheduled.map((i) => parseInt(i.scheduledTime!.split(":")[0], 10)),
      ...busyHours,
    ];
    const minHour = hours.length > 0 ? Math.min(...hours) : new Date().getHours();
    const maxHour = hours.length > 0 ? Math.max(minHour, ...hours) : minHour + 1;
    const currentHour = new Date().getHours();

    const entriesByHour: Record<number, HourlyEntry[]> = {};
    const hourlyEntries: HourlyEntry[] = [
      ...scheduled.map((item) => ({
        kind: "item" as const,
        startMinutes: timeToMinutes(item.scheduledTime!),
        item,
      })),
      ...busyBlocks.map((busyBlock, index) => ({
        kind: "busy" as const,
        startMinutes: timeToMinutes(busyBlock.startTime),
        busyBlock,
        key: busyBlockKey(busyBlock, index),
      })),
    ].sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
      if (a.kind === b.kind) return 0;
      return a.kind === "busy" ? -1 : 1;
    });

    for (let h = minHour; h <= maxHour; h++) {
      entriesByHour[h] = hourlyEntries.filter(
        (entry) => parseInt(
          (entry.kind === "item" ? entry.item.scheduledTime! : entry.busyBlock.startTime).split(":")[0],
          10
        ) === h
      );
    }

    const renderHourlyItem = (item: DailyItem) => (
      <div
        key={item.dailyItemId}
        className={`${styles.hourlyItem} ${item.completed ? styles.listItemCompleted : ""}`}
      >
        <button
          className={`${styles.itemCheckbox} ${item.completed ? styles.checkboxChecked : styles.checkboxUnchecked}`}
          onClick={() => handleToggle(item.dailyItemId)}
          aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
        >
          {item.completed ? (
            <IoCheckmarkCircle size={18} />
          ) : (
            <IoEllipseOutline size={18} />
          )}
        </button>
        <div className={styles.itemContent}>
          <span className={styles.itemTitle}>{item.title}</span>
          {item.notes && <span className={styles.itemNotes}>{item.notes}</span>}
          {item.scheduledTime && (
            <span className={styles.timeBadge}>
              <IoClock size={11} />
              {formatTime12h(item.scheduledTime)}
            </span>
          )}
          {item.parentGoalTitle && (
            <span className={styles.goalPill}>{item.parentGoalTitle}</span>
          )}
        </div>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
          onClick={() => handleDelete(item.dailyItemId)}
          aria-label="Delete"
          title="Delete"
        >
          <IoTrash size={13} />
        </button>
      </div>
    );

    const renderBusyBlock = (busyBlock: DailyChecklistBusyBlock, key: string) => (
      <div key={key} className={styles.busyBlockCard}>
        <div className={styles.busyBlockIndicator}>
          <IoCalendarOutline size={16} />
        </div>
        <div className={styles.itemContent}>
          <span className={styles.busyBlockTitle}>{busyBlock.summary || "Busy"}</span>
          <span className={styles.busyBlockLabel}>Calendar block</span>
          <div className={styles.itemMeta}>
            <span className={styles.timeBadge}>
              <IoClock size={11} />
              {formatTime12h(busyBlock.startTime)} - {formatTime12h(busyBlock.endTime)}
            </span>
          </div>
        </div>
      </div>
    );

    const label12 = (h: number) => {
      if (h === 0 || h === 12) return "12";
      return h > 12 ? `${h - 12}` : `${h}`;
    };

    return (
      <div className={styles.hourlyView}>
        {unscheduled.length > 0 && (
          <div className={styles.hourRow}>
            <div className={styles.hourLabel}>
              <span className={styles.hourText}>—</span>
              <span className={styles.hourAmPm}>Any</span>
            </div>
            <div className={styles.hourItems}>
              {unscheduled.map(renderHourlyItem)}
            </div>
          </div>
        )}

        {Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i).map((h) => {
          const hourEntries = entriesByHour[h] ?? [];
          const isNow = h === currentHour;
          const isPast = h < currentHour;

          return (
            <div
              key={h}
              className={`${styles.hourRow} ${isNow ? styles.hourRowNow : ""} ${isPast && hourEntries.length === 0 ? styles.hourRowEmpty : ""}`}
            >
              <div className={styles.hourLabel}>
                <span className={styles.hourText}>{label12(h)}</span>
                <span className={styles.hourAmPm}>{h < 12 ? "AM" : "PM"}</span>
              </div>
              <div className={styles.hourItems}>
                {isNow && <div className={styles.nowLine} />}
                {hourEntries.length > 0 ? (
                  hourEntries.map((entry) =>
                    entry.kind === "item"
                      ? renderHourlyItem(entry.item)
                      : renderBusyBlock(entry.busyBlock, entry.key)
                  )
                ) : (
                  <div className={styles.hourSlotEmpty} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading today&apos;s plan...</span>
        </div>
      </div>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const dateLabel = (checklist
    ? new Date(checklist.planDate + "T00:00:00")
    : new Date()
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.dateLine}>{dateLabel}</span>
          <h1 className={styles.pageTitle}>Today</h1>
        </div>
        <div className={styles.headerRight}>
          {checklist && checklist.generationCount < 2 && (
            <button
              className={styles.headerIconBtn}
              onClick={() => void handleGenerate()}
              aria-label="Regenerate daily plan"
              title={isGenerating ? "Regenerating daily plan" : "Regenerate"}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div className={styles.inlineSpinner} aria-hidden="true" />
              ) : (
                <IoRefresh size={16} />
              )}
            </button>
          )}
          <div className={styles.viewTabs}>
            <button
              className={`${styles.viewTab} ${view === "list" ? styles.viewTabActive : ""}`}
              onClick={() => setView("list")}
            >
              <IoListOutline size={14} />
              <span>Current</span>
            </button>
            <button
              className={`${styles.viewTab} ${view === "hourly" ? styles.viewTabActive : ""}`}
              onClick={() => setView("hourly")}
            >
              <IoCalendarOutline size={14} />
              <span>Hourly</span>
            </button>
          </div>

          {config && (
            <button
              className={`${styles.headerIconBtn} ${showConfig ? styles.headerIconBtnActive : ""}`}
              onClick={() => setShowConfig(!showConfig)}
              aria-label="Settings"
              title="Configure"
            >
              <IoSettings size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={styles.progressText}>
            {completedCount} of {totalCount}
          </span>
        </div>
      )}

      {/* Error */}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {isGenerating && checklist && (
        <div className={styles.statusBanner} aria-live="polite">
          <div className={styles.inlineSpinner} />
          <span>Regenerating today&apos;s plan...</span>
        </div>
      )}

      {/* Calendar notice */}
      {calendarNotice && (
        <div className={styles.calendarNotice}>
          <span>{calendarNotice}</span>
          <button
            className={styles.calendarNoticeDismiss}
            onClick={() => setCalendarNotice(null)}
            aria-label="Dismiss"
          >
            <IoClose size={14} />
          </button>
        </div>
      )}

      {/* Config panel */}
      {showConfig && config && (
        <div className={styles.configWrap}>
          <DailyChecklistConfig
            config={config}
            goals={goals}
            onSave={handleSaveConfig}
            onConfigChange={loadData}
          />
        </div>
      )}

      {/* Main content */}
      {!checklist ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            No plan for today yet. Generate a daily plan tailored to your goals
            and routines.
          </p>
          <button
            className={styles.generateBtn}
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
                <IoSparkles size={15} />
                Generate Daily Plan
              </>
            )}
          </button>
        </div>
      ) : view === "list" ? (
        renderListView()
      ) : (
        renderHourlyView()
      )}
    </div>
  );
}
