"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "@/styles/navbar.module.css";
import {
  IoHandRight,
  IoFlagOutline,
  IoListOutline,
  IoDocumentText,
  IoPerson,
  IoMoon,
  IoSunny
} from "react-icons/io5";

export default function NavBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.navBrand}>
          <span>NagAI</span>
        </Link>

        <ul className={styles.navLinks}>
          <li className={styles.navLink}>
            <Link
              href="/support"
              className={`${styles.navLinkAnchor} ${isActive("/support") ? styles.active : ""}`}
            >
              <IoHandRight size={20} />
              <span>Support</span>
            </Link>
          </li>
          <li className={styles.navLink}>
            <Link
              href="/goals"
              className={`${styles.navLinkAnchor} ${isActive("/goals") ? styles.active : ""}`}
            >
              <IoFlagOutline size={20} />
              <span>Goals</span>
            </Link>
          </li>
          <li className={styles.navLink}>
            <Link
              href="/checklists"
              className={`${styles.navLinkAnchor} ${isActive("/checklists") ? styles.active : ""}`}
            >
              <IoListOutline size={20} />
              <span>Checklists</span>
            </Link>
          </li>
          <li className={styles.navLink}>
            <Link
              href="/digests"
              className={`${styles.navLinkAnchor} ${isActive("/digests") ? styles.active : ""}`}
            >
              <IoDocumentText size={20} />
              <span>Digests</span>
            </Link>
          </li>
        </ul>

        <div className={styles.navRight}>
          <Link
            href="/profile"
            className={`${styles.navLinkAnchor} ${isActive("/profile") ? styles.active : ""}`}
            style={{ marginRight: "8px" }}
          >
            <IoPerson size={20} />
            <span>Profile</span>
          </Link>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <IoMoon size={20} /> : <IoSunny size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}