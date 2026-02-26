"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/authService";
import styles from "@/styles/navbar.module.css";
import { IoMenuOutline, IoCloseOutline } from "react-icons/io5";

export default function NavBar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  if (isLoggedIn) {
    return (
      <nav className={styles.navbar}>
        <Link href="/" className={styles.brand}>
          NagAI
        </Link>

        <button
          className={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <IoCloseOutline size={22} /> : <IoMenuOutline size={22} />}
        </button>

        <div className={`${styles.navCenter} ${mobileOpen ? styles.navCenterOpen : ""}`}>
          <Link
            href="/"
            className={`${styles.navLink} ${isActive("/") && pathname === "/" ? styles.navLinkActive : ""}`}
          >
            Dashboard
          </Link>
          <Link
            href="/goals"
            className={`${styles.navLink} ${isActive("/goals") ? styles.navLinkActive : ""}`}
          >
            Goals
          </Link>
          <Link
            href="/checklists"
            className={`${styles.navLink} ${isActive("/checklists") ? styles.navLinkActive : ""}`}
          >
            Checklists
          </Link>
          <Link
            href="/digests"
            className={`${styles.navLink} ${isActive("/digests") ? styles.navLinkActive : ""}`}
          >
            Digests
          </Link>
          <Link
            href="/agent"
            className={`${styles.navLink} ${isActive("/agent") ? styles.navLinkActive : ""}`}
          >
            Agent
          </Link>
        </div>

        <div className={styles.navRight}>
          <Link
            href="/profile"
            className={`${styles.navLink} ${styles.profileLink} ${isActive("/profile") ? styles.navLinkActive : ""}`}
          >
            Profile
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.brand}>
        NagAI
      </Link>

      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <IoCloseOutline size={22} /> : <IoMenuOutline size={22} />}
      </button>

      <div className={`${styles.navRight} ${mobileOpen ? styles.navRightOpen : ""}`}>
        <Link href="/learn-more" className={styles.navLink}>
          Learn More
        </Link>
        <Link href="/login" className={styles.navLink}>
          Log In
        </Link>
        <Link href="/signup" className={styles.ctaLink}>
          Get Started
        </Link>
      </div>
    </nav>
  );
}
