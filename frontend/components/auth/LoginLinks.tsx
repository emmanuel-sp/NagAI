/** LoginLinks Component - Navigation links for login page. Parent: LoginContainer */
"use client";
import Link from "next/link";
import styles from "@/styles/pages/login.module.css";

export default function LoginLinks() {
  return (
    <>
      <div className={styles.divider}>OR</div>

      <div className={styles.linkText}>
        Don&apos;t have an account? <Link href="/signup">Create one</Link>
      </div>

      <div className={styles.linkText} style={{ marginTop: "24px" }}>
        <Link href="/">Back to home</Link>
      </div>
    </>
  );
}
