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
import ListCard from "./ListCard";
import ProfileActions from "./ProfileActions";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import styles from "./profile.module.css";

const AI_CONTEXT_FIELDS: Array<{ key: keyof UserProfile; label: string }> = [
  { key: "age", label: "Age" },
  { key: "career", label: "Career" },
  { key: "bio", label: "Bio" },
  { key: "interests", label: "Interests" },
  { key: "hobbies", label: "Hobbies" },
  { key: "habits", label: "Habits" },
  { key: "lifeContext", label: "Life context" },
];

function countAiContextFields(profile: UserProfile): number {
  return AI_CONTEXT_FIELDS.filter(({ key }) => {
    const val = profile[key];
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "number") return val != null;
    return typeof val === "string" && val.trim().length > 0;
  }).length;
}

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
      prev ? { ...prev, [field]: value } : prev
    );
  };

  const handleAddItem = (listField: "interests" | "hobbies" | "habits", item: string) => {
    if (item.trim()) {
      setProfile((prev) =>
        prev ? { ...prev, [listField]: [...(prev[listField] || []), item.trim()] } : prev
      );
    }
  };

  const handleRemoveItem = (listField: "interests" | "hobbies" | "habits", index: number) => {
    setProfile((prev) =>
      prev ? { ...prev, [listField]: prev?.[listField]?.filter((_, i) => i !== index) || [] } : prev
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
      router.push("/");
    } catch (error) {
      console.error("Failed to logout:", error);
      router.push("/");
    }
  };

  if (!profile) {
    return (
      <div className={styles.profileContainer}>
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  const aiContextCount = countAiContextFields(profile);
  const aiContextTotal = AI_CONTEXT_FIELDS.length;

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const renderValue = (value: string | undefined | null, fallback = "Tap edit to add") => {
    if (value && value.trim()) {
      return <div className={styles.fieldValue}>{value}</div>;
    }
    return <div className={styles.fieldValueEmpty}>{fallback}</div>;
  };

  return (
    <div className={styles.profileContainer}>
      {saveMessage && <div className={styles.successMessage}>{saveMessage}</div>}

      {/* Profile Hero */}
      <div className={styles.profileHero}>
        <div className={styles.avatarCircle}>{initials}</div>
        <div className={styles.heroInfo}>
          <div className={styles.heroName}>{profile.fullName || "Your Name"}</div>
          <div className={styles.heroDetail}>
            {[profile.career, profile.userLocation].filter(Boolean).join(" · ") || "Tell us about yourself"}
          </div>
        </div>
      </div>

      <div className={styles.profileContent}>
        {/* Basic Info */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Basic Info</h2>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Name</label>
            {isEditing ? (
              <input className={styles.fieldInput} type="text" value={profile.fullName} onChange={(e) => handleFieldChange("fullName", e.target.value)} />
            ) : (
              <div className={styles.fieldValue}>{profile.fullName}</div>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Email</label>
            {isEditing ? (
              <input className={styles.fieldInput} type="email" value={profile.email} onChange={(e) => handleFieldChange("email", e.target.value)} />
            ) : (
              <div className={styles.fieldValue}>{profile.email}</div>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Age</label>
            {isEditing ? (
              <input
                className={styles.fieldInput}
                type="number"
                min={1}
                max={120}
                value={profile.age ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, age: e.target.value ? parseInt(e.target.value, 10) : undefined } : prev
                  )
                }
                placeholder="e.g., 28"
              />
            ) : (
              renderValue(profile.age?.toString(), "How old are you?")
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Phone Number</label>
            {isEditing ? (
              <input className={styles.fieldInput} type="tel" value={profile.phoneNumber || ""} onChange={(e) => handleFieldChange("phoneNumber", e.target.value)} placeholder="e.g., +1 (555) 123-4567" />
            ) : (
              renderValue(profile.phoneNumber, "Add your number")
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Location</label>
            {isEditing ? (
              <input className={styles.fieldInput} type="text" value={profile.userLocation || ""} onChange={(e) => handleFieldChange("userLocation", e.target.value)} />
            ) : (
              renderValue(profile.userLocation, "Where are you based?")
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Timezone</label>
            <div className={styles.fieldValue}>{profile.timezone || "UTC"}</div>
            <div className={styles.fieldValueEmpty} style={{ fontSize: "0.8rem" }}>Auto-detected from your browser</div>
          </div>
        </div>

        {/* About You */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>About You</h2>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Career</label>
            {isEditing ? (
              <input className={styles.fieldInput} type="text" value={profile.career || ""} onChange={(e) => handleFieldChange("career", e.target.value)} placeholder="e.g., Software Engineer" />
            ) : (
              renderValue(profile.career, "What do you do?")
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Bio</label>
            {isEditing ? (
              <textarea className={styles.fieldTextarea} value={profile.bio || ""} onChange={(e) => handleFieldChange("bio", e.target.value)} placeholder="A little about who you are..." maxLength={500} />
            ) : (
              <div className={profile.bio ? styles.fieldValue : styles.fieldValueEmpty} style={{ minHeight: "48px", alignItems: "flex-start" }}>
                {profile.bio || "Share a bit about yourself"}
              </div>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>What are you working towards?</label>
            {isEditing ? (
              <textarea
                className={styles.fieldTextarea}
                value={profile.lifeContext || ""}
                onChange={(e) => handleFieldChange("lifeContext", e.target.value)}
                placeholder="e.g., Building financial independence while staying healthy and present for my family..."
              />
            ) : (
              <div className={profile.lifeContext ? styles.fieldValue : styles.fieldValueEmpty} style={{ minHeight: "48px", alignItems: "flex-start" }}>
                {profile.lifeContext || "What drives you forward?"}
              </div>
            )}
          </div>
        </div>

        {/* List cards */}
        <ListCard title="Interests" subtitle="Things you care about" items={profile.interests || []} isEditing={isEditing} placeholder="Add an interest..." onAdd={(item) => handleAddItem("interests", item)} onRemove={(index) => handleRemoveItem("interests", index)} />
        <ListCard title="Hobbies" subtitle="What you love to do" items={profile.hobbies || []} isEditing={isEditing} placeholder="Add a hobby..." onAdd={(item) => handleAddItem("hobbies", item)} onRemove={(index) => handleRemoveItem("hobbies", index)} />
        <ListCard title="Habits" subtitle="Your daily routines" items={profile.habits || []} isEditing={isEditing} placeholder="Add a habit..." onAdd={(item) => handleAddItem("habits", item)} onRemove={(index) => handleRemoveItem("habits", index)} />

        {/* AI Context */}
        <div className={`${styles.profileCard} ${styles.aiContextCard}`}>
          <h2 className={styles.cardTitle}>AI Context</h2>
          <p className={styles.cardSubtitle}>The more you share, the better your AI suggestions become</p>
          <div className={styles.fieldGroup}>
            <div className={styles.aiContextBar}>
              <div
                className={styles.aiContextFill}
                style={{ width: `${(aiContextCount / aiContextTotal) * 100}%` }}
              />
            </div>
            <div className={styles.aiContextLabel}>
              {aiContextCount} of {aiContextTotal} fields filled
            </div>
            <div className={styles.aiContextFields}>
              {AI_CONTEXT_FIELDS.map(({ key, label }) => {
                const val = profile[key];
                const filled = Array.isArray(val)
                  ? val.length > 0
                  : typeof val === "number"
                  ? val != null
                  : typeof val === "string" && val.trim().length > 0;
                return (
                  <span key={key} className={filled ? styles.aiContextFieldFilled : styles.aiContextFieldEmpty}>
                    {filled ? "\u2713 " : ""}{label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Security</h2>
          <p className={styles.cardSubtitle}>Password changes require additional verification</p>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Password</label>
            {isEditing ? (
              <input className={styles.fieldInput} type="password" placeholder="Leave blank to keep current" />
            ) : (
              <div className={styles.fieldValue}>••••••••</div>
            )}
          </div>
        </div>
      </div>

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
