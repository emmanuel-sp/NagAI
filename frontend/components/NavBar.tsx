"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useModal } from "@/contexts/ModalContext";
import styles from "./NavBar.module.css";
import { IoSidebarPanel } from "@/components/icons";

const navLinks = [
  { href: "/home", label: "Dashboard" },
  { href: "/goals", label: "Goals" },
  { href: "/checklists", label: "Checklists" },
  { href: "/digests", label: "Digests" },
  { href: "/agent", label: "Agent" },
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

  if (!isLoggedIn || pathname === "/onboarding") return null;

  return (
    <>
      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
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

        {/* Spacer */}
        <div className={styles.spacer} />

        {/* Profile */}
        <Link
          href="/profile"
          className={`${styles.navLink} ${styles.profileLink} ${active("/profile") ? styles.navLinkActive : ""}`}
        >
          Profile
        </Link>
      </nav>

      {/* Toggle button — after nav so we can use ~ sibling selector on mobile */}
      <button
        className={`${styles.toggleButton} ${collapsed && !mobileOpen ? styles.toggleCollapsed : ""}`}
        onClick={handleToggle}
        aria-label="Toggle sidebar"
      >
        <IoSidebarPanel size={18} />
      </button>
    </>
  );
}
