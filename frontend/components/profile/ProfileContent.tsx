/**
 * ProfileContent Component
 *
 * Main content area containing all profile cards (basic info, professional, interests, etc).
 *
 * Parent: ProfileContainer
 * Children:
 * - BasicInfoCard
 * - ProfessionalCard
 * - InterestsCard
 * - HobbiesCard
 * - HabitsCard
 * - SecurityCard
 *
 * Props:
 * - profile: User profile data
 * - isEditing: Whether profile is in edit mode
 * - onFieldChange: Callback for text field changes
 * - onAddItem: Callback to add item to lists (interests, hobbies, habits)
 * - onRemoveItem: Callback to remove item from lists
 */

"use client";

import { UserProfile } from "@/services/profileService";
import BasicInfoCard from "@/components/profile/BasicInfoCard";
import ProfessionalCard from "@/components/profile/ProfessionalCard";
import InterestsCard from "@/components/profile/InterestsCard";
import HobbiesCard from "@/components/profile/HobbiesCard";
import HabitsCard from "@/components/profile/HabitsCard";
import SecurityCard from "@/components/profile/SecurityCard";
import styles from "@/styles/pages/profile.module.css";

interface ProfileContentProps {
  profile: UserProfile;
  isEditing: boolean;
  onFieldChange: (
    field: keyof Omit<UserProfile, "interests" | "hobbies" | "habits">,
    value: string
  ) => void;
  onAddItem: (listField: "interests" | "hobbies" | "habits", item: string) => void;
  onRemoveItem: (listField: "interests" | "hobbies" | "habits", index: number) => void;
}

export default function ProfileContent({
  profile,
  isEditing,
  onFieldChange,
  onAddItem,
  onRemoveItem,
}: ProfileContentProps) {
  return (
    <div className={styles.profileContent}>
      <BasicInfoCard
        profile={profile}
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />

      <ProfessionalCard
        profile={profile}
        isEditing={isEditing}
        onFieldChange={onFieldChange}
      />

      <InterestsCard
        items={profile.interests}
        isEditing={isEditing}
        onAdd={(item) => onAddItem("interests", item)}
        onRemove={(index) => onRemoveItem("interests", index)}
      />

      <HobbiesCard
        items={profile.hobbies}
        isEditing={isEditing}
        onAdd={(item) => onAddItem("hobbies", item)}
        onRemove={(index) => onRemoveItem("hobbies", index)}
      />

      <HabitsCard
        items={profile.habits}
        isEditing={isEditing}
        onAdd={(item) => onAddItem("habits", item)}
        onRemove={(index) => onRemoveItem("habits", index)}
      />

      <SecurityCard isEditing={isEditing} />
    </div>
  );
}
