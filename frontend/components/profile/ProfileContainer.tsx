/**
 * ProfileContainer Component
 *
 * Main container component for the Profile page that handles all business logic and state management.
 *
 * Component Hierarchy:
 * - ProfileContainer (this component)
 *   ├── ProfileHeader
 *   ├── ProfileContent
 *   │   ├── BasicInfoCard
 *   │   ├── ProfessionalCard
 *   │   ├── InterestsCard
 *   │   ├── HobbiesCard
 *   │   ├── HabitsCard
 *   │   └── SecurityCard
 *   └── ProfileActions
 *
 * Responsibilities:
 * - Fetch and manage user profile data
 * - Handle profile update operations
 * - Manage edit mode state
 * - Handle logout functionality
 * - Coordinate between child components
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";
import {
  fetchUserProfile,
  updateUserProfile,
} from "@/services/profileService";
import { logout } from "@/services/authService";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileContent from "@/components/profile/ProfileContent";
import ProfileActions from "@/components/profile/ProfileActions";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import styles from "@/styles/pages/profile.module.css";

export default function ProfileContainer() {
  const router = useRouter();
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!authLoading) {
      loadProfile();
    }
  }, [authLoading]);

  const loadProfile = async () => {
    try {
      const fetchedProfile = await fetchUserProfile();
      setProfile(fetchedProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const handleFieldChange = (
    field: keyof Omit<UserProfile, "interests" | "hobbies" | "habits">,
    value: string
  ) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : prev
    );
  };

  const handleAddItem = (listField: "interests" | "hobbies" | "habits", item: string) => {
    if (item.trim()) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              [listField]: [...prev[listField], item.trim()],
            }
          : prev
      );
    }
  };

  const handleRemoveItem = (
    listField: "interests" | "hobbies" | "habits",
    index: number
  ) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            [listField]: prev[listField].filter((_, i) => i !== index),
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      await updateUserProfile(profile);
      setSaveMessage("Profile saved successfully!");
      setIsEditing(false);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setSaveMessage("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
      router.push("/login");
    }
  };

  if (!profile) {
    return (
      <div className={styles.profileContainer}>
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <ProfileHeader saveMessage={saveMessage} />

      <ProfileContent
        profile={profile}
        isEditing={isEditing}
        onFieldChange={handleFieldChange}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
      />

      <ProfileActions
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={() => setIsEditing(true)}
        onCancel={() => setIsEditing(false)}
        onSave={handleSave}
        onLogout={handleLogout}
      />
    </div>
  );
}
