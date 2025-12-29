/** SecurityCard Component - Card for password management. Parent: ProfileContent */
"use client";
import styles from "@/styles/pages/profile.module.css";

interface SecurityCardProps {
  isEditing: boolean;
}

export default function SecurityCard({ isEditing }: SecurityCardProps) {
  return (
    <div className={styles.profileCard}>
      <h2 className={styles.cardTitle}>Security</h2>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Password</label>
        {isEditing ? (
          <input className={styles.fieldInput} type="password" placeholder="Leave blank to keep current" />
        ) : (
          <div className={styles.fieldValue}>••••••••</div>
        )}
      </div>

      <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
        Password changes require additional verification
      </p>
    </div>
  );
}
