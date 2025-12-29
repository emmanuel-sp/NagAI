/**
 * ProfessionalCard Component - Card displaying professional information (career, bio).
 * Parent: ProfileContent
 */

"use client";

import { UserProfile } from "@/types/user";
import styles from "@/styles/pages/profile.module.css";

interface ProfessionalCardProps {
  profile: UserProfile;
  isEditing: boolean;
  onFieldChange: (field: keyof Omit<UserProfile, "interests" | "hobbies" | "habits">, value: string) => void;
}

export default function ProfessionalCard({ profile, isEditing, onFieldChange }: ProfessionalCardProps) {
  return (
    <div className={styles.profileCard}>
      <h2 className={styles.cardTitle}>Professional</h2>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Career</label>
        {isEditing ? (
          <input className={styles.fieldInput} type="text" value={profile.career} onChange={(e) => onFieldChange("career", e.target.value)} />
        ) : (
          <div className={styles.fieldValue}>{profile.career}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Bio</label>
        {isEditing ? (
          <textarea className={styles.fieldTextarea} value={profile.bio} onChange={(e) => onFieldChange("bio", e.target.value)} />
        ) : (
          <div className={styles.fieldValue} style={{ minHeight: "60px", alignItems: "flex-start", padding: "12px" }}>{profile.bio}</div>
        )}
      </div>
    </div>
  );
}
