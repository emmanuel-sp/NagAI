/** SignupForm Component - Signup form with all required fields. Parent: SignupContainer */
"use client";
import styles from "@/styles/pages/login.module.css";

interface SignupFormProps {
  formData: { name: string; email: string; password: string; confirmPassword: string };
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SignupForm({ formData, isLoading, onChange, onSubmit }: SignupFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Full Name</label>
        <input className={styles.formInput} type="text" name="name" placeholder="Your full name" value={formData.name} onChange={onChange} disabled={isLoading} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Email</label>
        <input className={styles.formInput} type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={onChange} disabled={isLoading} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Password</label>
        <input className={styles.formInput} type="password" name="password" placeholder="At least 6 characters" value={formData.password} onChange={onChange} disabled={isLoading} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Confirm Password</label>
        <input className={styles.formInput} type="password" name="confirmPassword" placeholder="Confirm your password" value={formData.confirmPassword} onChange={onChange} disabled={isLoading} />
      </div>

      <button className={styles.submitButton} type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
