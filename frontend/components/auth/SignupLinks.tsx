/** SignupLinks Component - Navigation links for signup page. Parent: SignupContainer */
"use client";
import Link from "next/link";
import styles from "@/styles/pages/login.module.css";

export default function SignupLinks() {
  return (
    <>
      <div className={styles.divider}>OR</div>

      <div className={styles.linkText}>
        Already have an account? <Link href="/login">Login here</Link>
      </div>

      <div className={styles.linkText} style={{ marginTop: "24px" }}>
        <Link href="/">Back to home</Link>
      </div>
    </>
  );
}
