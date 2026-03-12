/** LoginForm Component - Login form with email and password fields. Parent: LoginContainer */
"use client";
import { useState } from "react";
import { IoEye, IoEyeOff } from "@/components/icons";
import styles from "./login.module.css";

interface LoginFormProps {
  email: string;
  password: string;
  isLoading: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({ email, password, isLoading, onEmailChange, onPasswordChange, onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.formGroup}>
        <input className={styles.formInput} type="email" placeholder="your@email.com" value={email} onChange={(e) => onEmailChange(e.target.value)} disabled={isLoading} id="login-email" />
        <label className={styles.formLabel} htmlFor="login-email">Email Address</label>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.passwordWrapper}>
          <input className={styles.formInput} type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => onPasswordChange(e.target.value)} disabled={isLoading} id="login-password" />
          <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
          </button>
        </div>
        <label className={styles.formLabel} htmlFor="login-password">Password</label>
      </div>

      <button className={styles.submitButton} type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
