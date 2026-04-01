/**
 * LoginContainer Component
 *
 * Container for login page with form logic and authentication.
 * Parent: LoginPage | Children: LoginForm, LoginLinks
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, loginWithGoogle } from "@/services/authService";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import styles from "./login.module.css";

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
      router.push("/home");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Invalid email or password.");
        } else if (err.status === 403 && err.message.includes("verify your email")) {
          setError("Please verify your email address. Check your inbox for the verification link.");
        } else if (err.status === 403) {
          setError("Your account has been locked. Please contact support.");
        } else {
          setError("Login failed. Please try again.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1 className={styles.loginTitle}>Welcome back</h1>
            <p className={styles.loginSubtitle}>Sign in to track your goals and stay accountable</p>
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

          <div className={styles.divider}>OR</div>

          <div className={styles.googleButtonWrapper}>
            <GoogleLogin
              theme="outline"
              size="large"
              width="100%"
              onSuccess={async (credentialResponse) => {
                try {
                  await loginWithGoogle(credentialResponse.credential!);
                  router.push("/home");
                } catch {
                  setError("Google sign-in failed. Please try again.");
                }
              }}
              onError={() => setError("Google sign-in failed. Please try again.")}
            />
          </div>

          <div className={styles.linkText} style={{ marginTop: "24px" }}>
            Don&apos;t have an account? <Link href="/signup">Create one</Link>
          </div>
          <div className={styles.linkText} style={{ marginTop: "16px" }}>
            <Link href="/">Back to home</Link>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
