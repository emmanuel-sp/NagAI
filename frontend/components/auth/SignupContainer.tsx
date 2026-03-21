/**
 * SignupContainer Component - Container for signup page with form logic and validation.
 * Parent: SignupPage | Children: SignupForm, SignupLinks
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup, loginWithGoogle } from "@/services/authService";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import SignupForm from "./SignupForm";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./login.module.css";

export default function SignupContainer() {
  const router = useRouter();
  const { loading } = useAuth({ redirectIfAuth: true });
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  if (loading) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <p style={{ textAlign: "center" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }

      await signup({ name: formData.name, email: formData.email, password: formData.password });
      setRegistered(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("An account with this email already exists.");
        } else if (err.status === 400) {
          setError(err.message || "Please check your input and try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1 className={styles.loginTitle}>Check your email</h1>
            <p className={styles.loginSubtitle}>We sent a verification link to <strong>{formData.email}</strong>. Click it to activate your account.</p>
          </div>
          <div className={styles.linkText} style={{ marginTop: "28px" }}>
            <Link href="/login">Back to login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Create Account</h1>
          <p className={styles.loginSubtitle}>Sign up to set personalized goals supported by AI</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <SignupForm formData={formData} isLoading={isLoading} onChange={handleChange} onSubmit={handleSubmit} />

        <div className={styles.divider}>OR</div>

        <div className={styles.googleButtonWrapper}>
          <GoogleLogin
            theme="outline"
            size="large"
            width="100%"
            onSuccess={async (credentialResponse) => {
              try {
                await loginWithGoogle(credentialResponse.credential!);
                router.push("/onboarding");
              } catch {
                setError("Google sign-in failed. Please try again.");
              }
            }}
            onError={() => setError("Google sign-in failed. Please try again.")}
          />
        </div>

        <div className={styles.linkText} style={{ marginTop: "24px" }}>
          Already have an account? <Link href="/login">Login here</Link>
        </div>
        <div className={styles.linkText} style={{ marginTop: "16px" }}>
          <Link href="/">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
