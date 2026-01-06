/**
 * BasicInfoCard Component
 *
 * Card displaying basic user information (name, email, location).
 *
 * Parent: ProfileContent
 * Children: None (presentational component)
 */

"use client";

import { UserProfile } from "@/types/user";
import styles from "@/styles/pages/profile.module.css";

interface BasicInfoCardProps {
  profile: UserProfile;
  isEditing: boolean;
  onFieldChange: (
    field: keyof Omit<UserProfile, "interests" | "hobbies" | "habits">,
    value: string
  ) => void;
}

export default function BasicInfoCard({
  profile,
  isEditing,
  onFieldChange,
}: BasicInfoCardProps) {
  return (
    <div className={styles.profileCard}>
      <h2 className={styles.cardTitle}>Basic Info</h2>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Name</label>
        {isEditing ? (
          <input
            className={styles.fieldInput}
            type="text"
            value={profile.fullName}
            onChange={(e) => onFieldChange("fullName", e.target.value)}
          />
        ) : (
          <div className={styles.fieldValue}>{profile.fullName}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Email</label>
        {isEditing ? (
          <input
            className={styles.fieldInput}
            type="email"
            value={profile.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
          />
        ) : (
          <div className={styles.fieldValue}>{profile.email}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Phone Number</label>
        {isEditing ? (
          <input
            className={styles.fieldInput}
            type="tel"
            value={profile.phoneNumber || ""}
            onChange={(e) => onFieldChange("phoneNumber", e.target.value)}
            placeholder="e.g., +1 (555) 123-4567"
          />
        ) : (
          <div className={styles.fieldValue}>{profile.phoneNumber || "Not provided"}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Location</label>
        {isEditing ? (
          <input
            className={styles.fieldInput}
            type="text"
            value={profile.userLocation || ""}
            onChange={(e) => onFieldChange("userLocation", e.target.value)}
          />
        ) : (
          <div className={styles.fieldValue}>{profile.userLocation || "Not provided"}</div>
        )}
      </div>
    </div>
  );
}
