"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <span className={styles.copyright}>
          &copy; {currentYear} Emmanuel Pierre
        </span>
        <nav className={styles.footerNav}>
          <Link href="/terms" className={styles.footerLink}>Terms</Link>
          <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
          <a
            href="https://github.com/emmanuel-sp"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/emmanuel-pierre/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            LinkedIn
          </a>
          <a
            href="https://www.emmanuelp.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Website
          </a>
        </nav>
      </div>
    </footer>
  );
}
