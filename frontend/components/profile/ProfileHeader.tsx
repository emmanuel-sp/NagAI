/**
 * ProfileHeader Component
 *
 * Header section for the Profile page displaying title, subtitle, and success message.
 *
 * Parent: ProfileContainer
 * Children: None (presentational component)
 *
 * Props:
 * - saveMessage: Success/error message to display
 */

"use client";

import styles from "@/styles/pages/profile.module.css";

interface ProfileHeaderProps {
  saveMessage: string;
}

export default function ProfileHeader({ saveMessage }: ProfileHeaderProps) {
  return (
    <>
      <div className={styles.profileHeader}>
        <h1 className={styles.profileTitle}>Profile</h1>
        <p className={styles.profileSubtitle}>Manage your profile information</p>
      </div>

      {saveMessage && <div className={styles.successMessage}>{saveMessage}</div>}
    </>
  );
}
