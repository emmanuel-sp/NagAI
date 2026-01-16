"use client";

import Link from "next/link";
import styles from "@/styles/footer.module.css";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerMain}>
          <div className={styles.brandSection}>
            <span className={styles.brandName}>NagAI</span>
            <p className={styles.tagline}>
              Your AI-powered accountability partner for achieving goals.
            </p>
          </div>

          <div className={styles.linksSection}>
            <div className={styles.linkGroup}>
              <span className={styles.linkGroupTitle}>Legal</span>
              <Link href="/terms" className={styles.footerLink}>
                Terms of Service
              </Link>
              <Link href="/privacy" className={styles.footerLink}>
                Privacy Policy
              </Link>
            </div>

            <div className={styles.linkGroup}>
              <span className={styles.linkGroupTitle}>Connect</span>
              <a
                href="https://www.linkedin.com/in/emmanuel-pierre/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <FaLinkedin size={16} />
                LinkedIn
              </a>
              <a
                href="https://github.com/emmanuel-sp"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <FaGithub size={16} />
                GitHub
              </a>
              <a
                href="https://www.emmanuelp.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <FaGlobe size={16} />
                Website
              </a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} Emmanuel Pierre. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
