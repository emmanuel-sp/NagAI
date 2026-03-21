"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/authService";
import { useModal } from "@/contexts/ModalContext";
import styles from "./NavBar.module.css";
import { IoMenuOutline, IoCloseOutline, IoHome, IoPerson } from "@/components/icons";

export default function NavBar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { modalOpen } = useModal();

  useEffect(() => {
    getCurrentUser().then((user) => setIsLoggedIn(!!user));
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = (path: string) =>
    path === "/home" ? pathname === "/home" : pathname.startsWith(path);

  if (!isLoggedIn || pathname === "/onboarding") return null;

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""} ${modalOpen ? styles.navbarDisabled : ""}`}>
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <IoCloseOutline size={22} /> : <IoMenuOutline size={22} />}
      </button>

      {/* Dashboard - left */}
      <Link
        href="/home"
        className={`${styles.navIconLink} ${active("/home") ? styles.navLinkActive : ""}`}
        aria-label="Home"
        title="Home"
      >
        <IoHome size={18} />
      </Link>

      {/* Center links */}
      <div className={`${styles.navCenter} ${mobileOpen ? styles.navCenterOpen : ""}`}>
        <Link href="/goals" className={`${styles.navLink} ${active("/goals") ? styles.navLinkActive : ""}`}>Goals</Link>
        <Link href="/checklists" className={`${styles.navLink} ${active("/checklists") ? styles.navLinkActive : ""}`}>Checklists</Link>
        <Link href="/digests" className={`${styles.navLink} ${active("/digests") ? styles.navLinkActive : ""}`}>Digests</Link>
        <Link href="/agent" className={`${styles.navLink} ${active("/agent") ? styles.navLinkActive : ""}`}>Agent</Link>
      </div>

      {/* Profile - right */}
      <Link
        href="/profile"
        className={`${styles.navIconLink} ${styles.navIconRight} ${active("/profile") ? styles.navLinkActive : ""}`}
        aria-label="Profile"
        title="Profile"
      >
        <IoPerson size={18} />
      </Link>
    </nav>
  );
}
