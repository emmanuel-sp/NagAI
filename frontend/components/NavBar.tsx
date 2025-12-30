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
  IoLogIn
} from "react-icons/io5";

export default function NavBar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, [pathname]);

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

        <div className={styles.navRight}>
          {isLoggedIn && (
            <ul className={styles.navLinks}>
              <li className={styles.navLink}>
                <Link
                  href="/goals"
                  className={`${styles.navLinkAnchor} ${isActive("/goals") ? styles.active : ""}`}
                >
                  
                  <span>GOALS</span>
                </Link>
              </li>
              <li className={styles.navLink}>
                <Link
                  href="/checklists"
                  className={`${styles.navLinkAnchor} ${isActive("/checklists") ? styles.active : ""}`}
                >
                  <span>CHECKLISTS</span>
                </Link>
              </li>
              <li className={styles.navLink}>
                <Link
                  href="/digests"
                  className={`${styles.navLinkAnchor} ${isActive("/digests") ? styles.active : ""}`}
                >
                  <span>DIGESTS</span>
                </Link>
              </li>
              <li className={styles.navLink}>
                <Link
                  href="/agent"
                  className={`${styles.navLinkAnchor} ${isActive("/agent") ? styles.active : ""}`}
                >
                  <span>AGENT</span>
                </Link>
              </li>
            </ul>
          )}

          {isLoggedIn && <div className={styles.navSeparator} />}

          {isLoggedIn ? (
            <Link
              href="/profile"
              className={`${styles.navLinkAnchor} ${isActive("/profile") ? styles.active : ""}`}
            >

              <span>PROFILE</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={`${styles.navLinkAnchor} ${isActive("/login") ? styles.active : ""}`}
            >
              <IoLogIn size={20} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}