"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useAgentData } from "@/contexts/AgentDataContext";
import { IoSidebarPanel, IoAdd, IoChevronDown, IoPerson, IoSun, IoMoon } from "@/components/icons";
import { useTheme, ACCENT_CONFIGS, type AccentKey } from "@/contexts/ThemeContext";
import { getAgentContextStatus } from "@/lib/agentStatus";
import MessageInboxTrigger from "@/components/inbox/MessageInboxTrigger";
import { createGoal } from "@/services/goalService";
import styles from "./NavBar.module.css";

const GoalFormModal = dynamic(() => import("@/components/goals/GoalFormModal"));

const navLinks = [
  { href: "/home", label: "Dashboard" },
  { href: "/today", label: "Today" },
  { href: "/goals", label: "Goals" },
  { href: "/digests", label: "Digests" },
  { href: "/chat", label: "Chat" },
];

interface NavBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function NavBar({ collapsed, onToggleCollapse }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { modalOpen } = useModal();
  const { mode, accent, setMode, setAccent } = useTheme();
  const {
    agent,
    goals,
    loading: agentLoading,
    handleDeployContext,
    handleStopContext,
    refreshAgent,
  } = useAgentData();

  const [goalsExpanded, setGoalsExpanded] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [deployingContextId, setDeployingContextId] = useState<number | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (modalOpen) {
      setMobileOpen(false);
    }
  }, [modalOpen]);

  const active = (path: string) =>
    path === "/home" ? pathname === "/home" : pathname.startsWith(path);
  const hideMobileToggle = modalOpen;

  const handleToggle = useCallback(() => {
    if (window.innerWidth <= 768) {
      setMobileOpen((value) => !value);
    } else {
      onToggleCollapse();
    }
  }, [onToggleCollapse]);

  const handleCreateGoal = async (data: {
    title: string;
    description: string;
    targetDate: string;
    specific: string;
    measurable: string;
    attainable: string;
    relevant: string;
    timely: string;
    stepsTaken: string;
  }) => {
    const goal = await createGoal(data);
    await refreshAgent();
    setIsGoalModalOpen(false);
    router.push(`/goals/${goal.goalId}`);
  };

  const handleToggleGoalDeployment = async (contextId: number, isDeployed: boolean) => {
    setDeployingContextId(contextId);
    try {
      if (isDeployed) {
        await handleStopContext(contextId);
      } else {
        await handleDeployContext(contextId);
      }
    } finally {
      setDeployingContextId(null);
    }
  };

  const canCreateGoal = goals.length < 10;

  return (
    <>
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      <nav
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""} ${collapsed ? styles.sidebarCollapsed : ""} ${modalOpen ? styles.sidebarDisabled : ""}`}
      >
        <div className={styles.brandRow}>
          <span className={styles.brandText}>NagAI</span>
        </div>

        <div className={styles.navLinks}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${active(href) ? styles.navLinkActive : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {!agentLoading && (
          <div className={styles.contextsSection}>
            <div className={styles.sectionHeaderRow}>
              <button
                type="button"
                className={styles.contextsSectionToggle}
                onClick={() => setGoalsExpanded((value) => !value)}
              >
                <span className={`${styles.contextsSectionChevron} ${goalsExpanded ? styles.contextsSectionChevronOpen : ""}`}>
                  <IoChevronDown size={12} />
                </span>
                <span className={styles.contextsSectionTitle}>Goal Workspaces</span>
              </button>
              {canCreateGoal && (
                <button
                  type="button"
                  className={styles.contextsSectionBtn}
                  title="Add goal"
                  onClick={() => setIsGoalModalOpen(true)}
                >
                  <IoAdd size={14} />
                </button>
              )}
            </div>

            {goalsExpanded && (
              <div className={styles.contextsList}>
                {goals.length === 0 ? (
                  <button
                    className={styles.contextsEmpty}
                    onClick={() => setIsGoalModalOpen(true)}
                  >
                    <IoAdd size={13} />
                    <span>Add your first goal</span>
                  </button>
                ) : (
                  goals.map((goal) => {
                    const context = (agent?.contexts ?? []).find((entry) => entry.goalId === goal.goalId) ?? null;
                    const isActiveGoal = pathname === `/goals/${goal.goalId}`;
                    const isDeploying = deployingContextId === context?.contextId;
                    const status = getAgentContextStatus(context);
                    const dotClassName = status.tone === "paused"
                      ? styles.goalStatusDotPaused
                      : context?.deployed
                        ? styles.goalStatusDotActive
                        : styles.goalStatusDotIdle;

                    return (
                      <div
                        key={goal.goalId}
                        className={`${styles.goalRow} ${isActiveGoal ? styles.goalRowActive : ""}`}
                      >
                        <Link
                          href={`/goals/${goal.goalId}`}
                          className={styles.goalRowLink}
                          title={goal.title}
                        >
                          <span className={styles.contextName}>
                            {goal.title}
                          </span>
                          {context && (
                            <span className={styles.contextStatusText}>
                              {status.tone === "cooling"
                                ? status.helperText
                                : status.tone === "paused"
                                  ? "Paused for inactivity"
                                  : status.label}
                            </span>
                          )}
                        </Link>
                        {context && (
                          <button
                            type="button"
                            className={`${styles.goalStatusDot} ${dotClassName}`}
                            onClick={() => void handleToggleGoalDeployment(context.contextId, context.deployed)}
                            disabled={isDeploying}
                            title={isDeploying ? "Updating..." : status.title}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.spacer} />

        <MessageInboxTrigger variant="nav" />

        <Link
          href="/profile"
          className={`${styles.navLink} ${styles.profileLink} ${active("/profile") ? styles.navLinkActive : ""}`}
        >
          <IoPerson size={15} />
          <span className={styles.navLinkLabel}>Profile</span>
        </Link>

        <div className={styles.themeSection}>
          <span className={styles.themeLabel}>Appearance</span>
          <div className={styles.modePicker}>
            <button
              className={`${styles.modeBtn} ${mode === "light" ? styles.modeBtnActive : ""}`}
              onClick={() => setMode("light")}
            >
              <IoSun size={12} />
              Light
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "dark" ? styles.modeBtnActive : ""}`}
              onClick={() => setMode("dark")}
            >
              <IoMoon size={12} />
              Dark
            </button>
          </div>
          <div className={styles.accentPicker}>
            {(Object.entries(ACCENT_CONFIGS) as [AccentKey, typeof ACCENT_CONFIGS[AccentKey]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  className={`${styles.accentSwatch} ${accent === key ? styles.accentSwatchActive : ""}`}
                  style={
                    key === "mono"
                      ? { background: "conic-gradient(#1a1a1a 180deg, #e0e0e0 180deg)" }
                      : { background: cfg.swatch }
                  }
                  title={cfg.label}
                  onClick={() => setAccent(key)}
                  aria-label={`${cfg.label} accent`}
                />
              )
            )}
          </div>
        </div>
      </nav>

      <button
        className={`${styles.toggleButton} ${collapsed && !mobileOpen ? styles.toggleCollapsed : ""} ${hideMobileToggle ? styles.toggleButtonHiddenMobile : ""}`}
        onClick={handleToggle}
        aria-label="Toggle sidebar"
      >
        <IoSidebarPanel size={16} strokeWidth={1.35} />
      </button>

      {isGoalModalOpen ? (
        <GoalFormModal
          mode="create"
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSubmit={handleCreateGoal}
        />
      ) : null}
    </>
  );
}
