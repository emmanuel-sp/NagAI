/** ProfileActions Component - Action buttons for profile (Edit, Save, Cancel, Logout). Parent: ProfileContainer */
"use client";
import styles from "@/styles/pages/profile.module.css";

interface ProfileActionsProps {
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onLogout: () => void;
}

export default function ProfileActions({ isEditing, isSaving, onEdit, onCancel, onSave, onLogout }: ProfileActionsProps) {
  return (
    <div className={styles.profileActions}>
      {!isEditing ? (
        <>
          <button className={styles.primaryButton} onClick={onEdit}>
            Edit Profile
          </button>
          <button className={styles.secondaryButton} onClick={onLogout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <button className={styles.secondaryButton} onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button className={styles.primaryButton} onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </>
      )}
    </div>
  );
}
