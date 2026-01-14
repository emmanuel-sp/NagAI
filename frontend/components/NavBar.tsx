"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/authService";
import styles from "@/styles/navbar.module.css";
import {
  IoConstruct,
  IoFlagOutline,
  IoListOutline,
  IoDocumentText,
  IoPerson,
  IoLogIn,
  IoHomeOutline,
  IoMenuOutline
} from "react-icons/io5";

export default function NavBar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      setIsLoggedIn(!!user);

      // Add/remove sidebar class to body
      if (user) {
        document.body.classList.add('has-sidebar');
        // Check if collapsed state is in localStorage
        const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setIsCollapsed(collapsed);
        if (collapsed) {
          document.body.classList.add('sidebar-collapsed');
        }
      } else {
        document.body.classList.remove('has-sidebar');
        document.body.classList.remove('sidebar-collapsed');
      }
    };
    checkAuth();
  }, [pathname]);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', String(newCollapsed));

    if (newCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <nav className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarHeader}>
          <button
            onClick={toggleSidebar}
            className={styles.hamburger}
            aria-label="Toggle sidebar"
          >
            <IoMenuOutline size={24} />
          </button>
          <Link href="/" className={styles.sidebarBrand}>
            <span className={styles.brandText}>NagAI</span>
          </Link>
        </div>

        <ul className={styles.sidebarLinks}>
          <li className={styles.sidebarLink}>
            <Link
              href="/"
              className={`${styles.sidebarLinkAnchor} ${isActive("/") && pathname === "/" ? styles.active : ""}`}
              title="Dashboard"
            >
              <IoHomeOutline size={22} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={styles.sidebarLink}>
            <Link
              href="/goals"
              className={`${styles.sidebarLinkAnchor} ${isActive("/goals") ? styles.active : ""}`}
              title="Goals"
            >
              <IoFlagOutline size={22} />
              <span>Goals</span>
            </Link>
          </li>
          <li className={styles.sidebarLink}>
            <Link
              href="/checklists"
              className={`${styles.sidebarLinkAnchor} ${isActive("/checklists") ? styles.active : ""}`}
              title="Checklists"
            >
              <IoListOutline size={22} />
              <span>Checklists</span>
            </Link>
          </li>
          <li className={styles.sidebarLink}>
            <Link
              href="/digests"
              className={`${styles.sidebarLinkAnchor} ${isActive("/digests") ? styles.active : ""}`}
              title="Digests"
            >
              <IoDocumentText size={22} />
              <span>Digests</span>
            </Link>
          </li>
          <li className={styles.sidebarLink}>
            <Link
              href="/agent"
              className={`${styles.sidebarLinkAnchor} ${isActive("/agent") ? styles.active : ""}`}
              title="Agent"
            >
              <IoConstruct size={22} />
              <span>Agent</span>
            </Link>
          </li>
        </ul>

        <div className={styles.sidebarFooter}>
          <Link
            href="/profile"
            className={`${styles.sidebarLinkAnchor} ${isActive("/profile") ? styles.active : ""}`}
            title="Profile"
          >
            <IoPerson size={22} />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}