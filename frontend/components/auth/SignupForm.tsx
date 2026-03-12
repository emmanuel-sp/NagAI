/** SignupForm Component - Signup form with all required fields. Parent: SignupContainer */
"use client";
import { useState } from "react";
import { IoEye, IoEyeOff } from "@/components/icons";
import styles from "./login.module.css";

interface SignupFormProps {
  formData: { name: string; email: string; password: string; confirmPassword: string };
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SignupForm({ formData, isLoading, onChange, onSubmit }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.formGroup}>
        <input className={styles.formInput} type="text" name="name" placeholder="Your full name" value={formData.name} onChange={onChange} disabled={isLoading} id="signup-name" />
        <label className={styles.formLabel} htmlFor="signup-name">Full Name</label>
      </div>

      <div className={styles.formGroup}>
        <input className={styles.formInput} type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={onChange} disabled={isLoading} id="signup-email" />
        <label className={styles.formLabel} htmlFor="signup-email">Email Address</label>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.passwordWrapper}>
          <input className={styles.formInput} type={showPassword ? "text" : "password"} name="password" placeholder="At least 6 characters" value={formData.password} onChange={onChange} disabled={isLoading} id="signup-password" />
          <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
          </button>
        </div>
        <label className={styles.formLabel} htmlFor="signup-password">Password</label>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.passwordWrapper}>
          <input className={styles.formInput} type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={onChange} disabled={isLoading} id="signup-confirm" />
          <button type="button" className={styles.passwordToggle} onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} aria-label={showConfirm ? "Hide password" : "Show password"}>
            {showConfirm ? <IoEyeOff size={18} /> : <IoEye size={18} />}
          </button>
        </div>
        <label className={styles.formLabel} htmlFor="signup-confirm">Confirm Password</label>
      </div>

      <button className={styles.submitButton} type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
