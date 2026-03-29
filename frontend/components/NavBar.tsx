"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useModal } from "@/contexts/ModalContext";
import { useAgentData } from "@/contexts/AgentDataContext";
import { AgentContext, CreateContextRequest } from "@/types/agent";
import ContextFormModal from "@/components/agent-builder/ContextFormModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { IoSidebarPanel, IoAdd, IoSettings, IoChevronDown, IoBell, IoPerson } from "@/components/icons";
import MessageInboxPanel from "@/components/inbox/MessageInboxPanel";
import styles from "./NavBar.module.css";

const navLinks = [
  { href: "/home", label: "Dashboard" },
  { href: "/goals", label: "Goals" },
  { href: "/checklists", label: "Checklists" },
  { href: "/digests", label: "Digests" },
  { href: "/chat", label: "Chat" },
];

interface NavBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function NavBar({ collapsed, onToggleCollapse }: NavBarProps) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { modalOpen } = useModal();

  // Nag Contexts section state
  const {
    agent,
    goals,
    loading: agentLoading,
    handleCreateContext,
    handleUpdateContext,
    handleDeleteContext,
    handleDeploy,
    handleStop,
  } = useAgentData();

  const [contextsExpanded, setContextsExpanded] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<AgentContext | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("authToken");
    setIsLoggedIn(hasToken);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const active = (path: string) =>
    path === "/home" ? pathname === "/home" : pathname.startsWith(path);

  const handleToggle = useCallback(() => {
    if (window.innerWidth <= 768) {
      setMobileOpen((v) => !v);
    } else {
      onToggleCollapse();
    }
  }, [onToggleCollapse]);

  const onCreateSubmit = async (data: CreateContextRequest) => {
    const result = await handleCreateContext(data);
    if (result) setIsCreateModalOpen(false);
  };

  const onEditSubmit = async (contextId: number, data: CreateContextRequest) => {
    const result = await handleUpdateContext(contextId, data);
    if (result) {
      setIsEditModalOpen(false);
      setSelectedContext(null);
    }
  };

  const onDeleteClick = (contextId: number) => {
    setConfirmAction({
      title: "Delete Context",
      message: "Are you sure you want to delete this context? This action cannot be undone.",
      onConfirm: async () => {
        setConfirmAction(null);
        await handleDeleteContext(contextId);
      },
    });
  };

  const onDeployClick = async () => {
    setIsDeploying(true);
    await handleDeploy();
    setIsDeploying(false);
  };

  const onStopClick = () => {
    setConfirmAction({
      title: "Stop Agent",
      message: "Stop sending messages? You can redeploy at any time.",
      onConfirm: async () => {
        setConfirmAction(null);
        setIsDeploying(true);
        await handleStop();
        setIsDeploying(false);
      },
    });
  };

  if (!isLoggedIn || pathname === "/onboarding") return null;

  const contexts = agent?.contexts ?? [];
  const isDeployed = agent?.deployed ?? false;
  const canCreate = contexts.length < 4;

  return (
    <>
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""} ${collapsed ? styles.sidebarCollapsed : ""} ${modalOpen ? styles.sidebarDisabled : ""}`}
      >
        {/* Brand */}
        <div className={styles.brandRow}>
          <span className={styles.brandText}>NagAI</span>
        </div>

        {/* Nav links */}
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

        {/* Nag Contexts Section */}
        {!agentLoading && agent && (
          <div className={styles.contextsSection}>
            <button
              className={styles.contextsSectionHeader}
              onClick={() => setContextsExpanded((v) => !v)}
            >
              <span className={`${styles.contextsSectionChevron} ${contextsExpanded ? styles.contextsSectionChevronOpen : ""}`}>
                <IoChevronDown size={12} />
              </span>
              <span className={styles.contextsSectionTitle}>Nag Contexts</span>
              <span className={styles.contextsSectionActions}>
                {canCreate && (
                  <span
                    className={styles.contextsSectionBtn}
                    role="button"
                    tabIndex={0}
                    title="Add context"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreateModalOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        setIsCreateModalOpen(true);
                      }
                    }}
                  >
                    <IoAdd size={14} />
                  </span>
                )}
                {contexts.length > 0 && (
                  <span
                    className={`${styles.deployPill} ${isDeployed ? styles.deployPillActive : styles.deployPillInactive}`}
                    role="button"
                    tabIndex={0}
                    title={isDeployed ? "Stop agent" : "Deploy agent"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDeploying) return;
                      isDeployed ? onStopClick() : onDeployClick();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        if (isDeploying) return;
                        isDeployed ? onStopClick() : onDeployClick();
                      }
                    }}
                  >
                    {isDeploying ? (
                      <span className={styles.miniSpinner} />
                    ) : (
                      <>
                        <span className={`${styles.deployDot} ${isDeployed ? styles.deployDotActive : styles.deployDotInactive}`} />
                        {isDeployed ? "Live" : "Deploy"}
                      </>
                    )}
                  </span>
                )}
              </span>
            </button>

            {contextsExpanded && (
              <div className={styles.contextsList}>
                {contexts.length === 0 ? (
                  <button
                    className={styles.contextsEmpty}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <IoAdd size={13} />
                    <span>Add a context</span>
                  </button>
                ) : (
                  contexts.map((ctx) => (
                    <div key={ctx.contextId} className={styles.contextRow}>
                      <span className={styles.contextName} title={ctx.name}>
                        {ctx.name}
                      </span>
                      <span className={styles.contextRowActions}>
                        <button
                          className={styles.contextActionBtn}
                          title="Configure"
                          onClick={() => {
                            setSelectedContext(ctx);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <IoSettings size={13} />
                        </button>
                        <button
                          className={`${styles.contextActionBtn} ${styles.contextDeleteBtn}`}
                          title="Delete"
                          onClick={() => onDeleteClick(ctx.contextId)}
                        >
                          &times;
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className={styles.spacer} />

        {/* Notification bell */}
        <button
          className={styles.bellBtn}
          onClick={() => setInboxOpen(true)}
          aria-label="Open message inbox"
          title="Messages"
        >
          <IoBell size={15} />
          <span className={styles.bellLabel}>Messages</span>
        </button>

        {/* Profile */}
        <Link
          href="/profile"
          className={`${styles.navLink} ${styles.profileLink} ${active("/profile") ? styles.navLinkActive : ""}`}
        >
          <IoPerson size={15} />
          <span className={styles.navLinkLabel}>Profile</span>
        </Link>
      </nav>

      <MessageInboxPanel isOpen={inboxOpen} onClose={() => setInboxOpen(false)} />

      <button
        className={`${styles.toggleButton} ${collapsed && !mobileOpen ? styles.toggleCollapsed : ""}`}
        onClick={handleToggle}
        aria-label="Toggle sidebar"
      >
        <IoSidebarPanel size={18} />
      </button>

      {/* Context create/edit modals */}
      <ContextFormModal
        mode="create"
        isOpen={isCreateModalOpen}
        goals={goals}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={onCreateSubmit}
      />

      {selectedContext && (
        <ContextFormModal
          mode="edit"
          isOpen={isEditModalOpen}
          goals={goals}
          context={selectedContext}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedContext(null);
          }}
          onSubmit={onEditSubmit}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.message ?? ""}
        confirmLabel={confirmAction?.title.startsWith("Delete") ? "Delete" : "Stop"}
        destructive
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
