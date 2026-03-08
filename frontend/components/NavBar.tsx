"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/authService";
import { useModal } from "@/contexts/ModalContext";
import styles from "./NavBar.module.css";
import { IoMenuOutline, IoCloseOutline } from "@/components/icons";

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
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  if (!isLoggedIn) return null;

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""} ${modalOpen ? styles.navbarDisabled : ""}`}>
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <IoCloseOutline size={22} /> : <IoMenuOutline size={22} />}
      </button>

      <div className={`${styles.navCenter} ${mobileOpen ? styles.navCenterOpen : ""}`}>
        <Link href="/" className={`${styles.navLink} ${active("/") ? styles.navLinkActive : ""}`}>Dashboard</Link>
        <Link href="/goals" className={`${styles.navLink} ${active("/goals") ? styles.navLinkActive : ""}`}>Goals</Link>
        <Link href="/checklists" className={`${styles.navLink} ${active("/checklists") ? styles.navLinkActive : ""}`}>Checklists</Link>
        <Link href="/digests" className={`${styles.navLink} ${active("/digests") ? styles.navLinkActive : ""}`}>Digests</Link>
        <Link href="/agent" className={`${styles.navLink} ${active("/agent") ? styles.navLinkActive : ""}`}>Agent</Link>
        <Link href="/profile" className={`${styles.navLink} ${active("/profile") ? styles.navLinkActive : ""}`}>Profile</Link>
      </div>
    </nav>
  );
}
