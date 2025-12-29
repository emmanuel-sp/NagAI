/**
 * BasicInfoCard Component
 *
 * Card displaying basic user information (name, email, location).
 *
 * Parent: ProfileContent
 * Children: None (presentational component)
 */

"use client";

import { UserProfile } from "@/services/profileService";
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
            value={profile.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />
        ) : (
          <div className={styles.fieldValue}>{profile.name}</div>
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
            value={profile.phone || ""}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            placeholder="e.g., +1 (555) 123-4567"
          />
        ) : (
          <div className={styles.fieldValue}>{profile.phone || "Not provided"}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Location</label>
        {isEditing ? (
          <input
            className={styles.fieldInput}
            type="text"
            value={profile.location}
            onChange={(e) => onFieldChange("location", e.target.value)}
          />
        ) : (
          <div className={styles.fieldValue}>{profile.location}</div>
        )}
      </div>
    </div>
  );
}
