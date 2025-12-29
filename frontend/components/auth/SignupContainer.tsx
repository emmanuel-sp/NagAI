/**
 * SignupContainer Component - Container for signup page with form logic and validation.
 * Parent: SignupPage | Children: SignupForm, SignupLinks
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import SignupForm from "./SignupForm";
import SignupLinks from "./SignupLinks";
import styles from "@/styles/pages/login.module.css";

export default function SignupContainer() {
  const router = useRouter();
  const { loading } = useAuth({ redirectIfAuth: true });
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
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
      router.push("/profile");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Create Account</h1>
          <p className={styles.loginSubtitle}>Join NagAI today</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <SignupForm formData={formData} isLoading={isLoading} onChange={handleChange} onSubmit={handleSubmit} />

        <SignupLinks />
      </div>
    </div>
  );
}
