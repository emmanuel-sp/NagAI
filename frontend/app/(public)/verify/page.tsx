"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/services/authService";
import styles from "@/components/auth/login.module.css";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "No verification token provided."
  );

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => {
        setErrorMessage("This link is invalid or has expired. Please sign up again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {status === "loading" && (
          <div className={styles.loginHeader}>
            <h1 className={styles.loginTitle}>Verifying...</h1>
            <p className={styles.loginSubtitle}>Please wait while we verify your email.</p>
          </div>
        )}

        {status === "success" && (
          <div className={styles.loginHeader}>
            <h1 className={styles.loginTitle}>Email verified</h1>
            <p className={styles.loginSubtitle}>Your account is active. You can now log in.</p>
            <div className={styles.linkText} style={{ marginTop: "28px" }}>
              <Link href="/login">Go to login</Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <>
            <div className={styles.loginHeader}>
              <h1 className={styles.loginTitle}>Verification failed</h1>
            </div>
            <div className={styles.errorMessage}>{errorMessage}</div>
            <div className={styles.linkText} style={{ marginTop: "12px" }}>
              <Link href="/signup">Back to sign up</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loginContainer}>
          <div className={styles.loginCard}>
            <div className={styles.loginHeader}>
              <h1 className={styles.loginTitle}>Verifying...</h1>
              <p className={styles.loginSubtitle}>Please wait while we verify your email.</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
