/**
 * LoginContainer Component
 *
 * Container for login page with form logic and authentication.
 * Parent: LoginPage | Children: LoginForm, LoginLinks
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "./LoginForm";
import LoginLinks from "./LoginLinks";
import styles from "@/styles/pages/login.module.css";

export default function LoginContainer() {
  const router = useRouter();
  const { loading } = useAuth({ redirectIfAuth: true });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <p style={{ textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      await login({ email, password });
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Login</h1>
          <p className={styles.loginSubtitle}>Welcome back to NagAI</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <LoginForm
          email={email}
          password={password}
          isLoading={isLoading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />

        <LoginLinks />
      </div>
    </div>
  );
}
