/** LoginForm Component - Login form with email and password fields. Parent: LoginContainer */
"use client";
import styles from "@/styles/pages/login.module.css";

interface LoginFormProps {
  email: string;
  password: string;
  isLoading: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({ email, password, isLoading, onEmailChange, onPasswordChange, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Email</label>
        <input className={styles.formInput} type="email" placeholder="your@email.com" value={email} onChange={(e) => onEmailChange(e.target.value)} disabled={isLoading} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Password</label>
        <input className={styles.formInput} type="password" placeholder="Enter your password" value={password} onChange={(e) => onPasswordChange(e.target.value)} disabled={isLoading} />
      </div>

      <button className={styles.submitButton} type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
