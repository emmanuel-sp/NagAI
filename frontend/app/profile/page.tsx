"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserProfile,
  fetchUserProfile,
  updateUserProfile,
} from "@/services/profileService";
import { logout } from "@/services/authService";
import styles from "@/styles/profile.module.css";
import { IoClose } from "react-icons/io5";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [tempInput, setTempInput] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

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

  const handleAddItem = (listField: "interests" | "hobbies" | "habits") => {
    if (tempInput.trim()) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              [listField]: [...prev[listField], tempInput.trim()],
            }
          : prev
      );
      setTempInput("");
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
        <div className={styles.profileHeader}>
          <h1 className={styles.profileTitle}>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <h1 className={styles.profileTitle}>Profile</h1>
        <p className={styles.profileSubtitle}>
          Manage your profile information
        </p>
      </div>

      {saveMessage && (
        <div className={styles.successMessage}>{saveMessage}</div>
      )}

      <div className={styles.profileContent}>
        {/* Basic Information Card */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Basic Info</h2>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Name</label>
            {isEditing ? (
              <input
                className={styles.fieldInput}
                type="text"
                value={profile.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
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
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
            ) : (
              <div className={styles.fieldValue}>{profile.email}</div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Location</label>
            {isEditing ? (
              <input
                className={styles.fieldInput}
                type="text"
                value={profile.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
              />
            ) : (
              <div className={styles.fieldValue}>{profile.location}</div>
            )}
          </div>
        </div>

        {/* Professional Card */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Professional</h2>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Career</label>
            {isEditing ? (
              <input
                className={styles.fieldInput}
                type="text"
                value={profile.career}
                onChange={(e) => handleFieldChange("career", e.target.value)}
              />
            ) : (
              <div className={styles.fieldValue}>{profile.career}</div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Bio</label>
            {isEditing ? (
              <textarea
                className={styles.fieldTextarea}
                value={profile.bio}
                onChange={(e) => handleFieldChange("bio", e.target.value)}
              />
            ) : (
              <div
                className={styles.fieldValue}
                style={{
                  minHeight: "60px",
                  alignItems: "flex-start",
                  padding: "12px",
                }}
              >
                {profile.bio}
              </div>
            )}
          </div>
        </div>

        {/* Interests Card */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Interests</h2>
          <p className={styles.cardSubtitle}>Things you care about</p>

          {profile.interests.length > 0 && (
            <div className={styles.bulkItems}>
              {profile.interests.map((item, idx) => (
                <div key={idx} className={styles.bulkItem}>
                  {item}
                  {isEditing && (
                    <span
                      className={styles.bulkItemRemove}
                      onClick={() => handleRemoveItem("interests", idx)}
                    >
                      <IoClose />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing && (
            <div className={styles.bulkFieldWrapper}>
              <input
                className={styles.bulkInput}
                type="text"
                placeholder="Add an interest..."
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem("interests");
                  }
                }}
              />
              <button
                className={styles.addButton}
                onClick={() => handleAddItem("interests")}
                style={{ marginTop: "8px" }}
              >
                Add Interest
              </button>
            </div>
          )}
        </div>

        {/* Hobbies Card */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Hobbies</h2>
          <p className={styles.cardSubtitle}>What you love to do</p>

          {profile.hobbies.length > 0 && (
            <div className={styles.bulkItems}>
              {profile.hobbies.map((item, idx) => (
                <div key={idx} className={styles.bulkItem}>
                  {item}
                  {isEditing && (
                    <span
                      className={styles.bulkItemRemove}
                      onClick={() => handleRemoveItem("hobbies", idx)}
                    >
                      <IoClose />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing && (
            <div className={styles.bulkFieldWrapper}>
              <input
                className={styles.bulkInput}
                type="text"
                placeholder="Add a hobby..."
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem("hobbies");
                  }
                }}
              />
              <button
                className={styles.addButton}
                onClick={() => handleAddItem("hobbies")}
                style={{ marginTop: "8px" }}
              >
                Add Hobby
              </button>
            </div>
          )}
        </div>

        {/* Habits Card */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Habits</h2>
          <p className={styles.cardSubtitle}>Your daily routines</p>

          {profile.habits.length > 0 && (
            <div className={styles.bulkItems}>
              {profile.habits.map((item, idx) => (
                <div key={idx} className={styles.bulkItem}>
                  {item}
                  {isEditing && (
                    <span
                      className={styles.bulkItemRemove}
                      onClick={() => handleRemoveItem("habits", idx)}
                    >
                      <IoClose />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing && (
            <div className={styles.bulkFieldWrapper}>
              <input
                className={styles.bulkInput}
                type="text"
                placeholder="Add a habit..."
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem("habits");
                  }
                }}
              />
              <button
                className={styles.addButton}
                onClick={() => handleAddItem("habits")}
                style={{ marginTop: "8px" }}
              >
                Add Habit
              </button>
            </div>
          )}
        </div>

        {/* Password Card */}
        <div className={styles.profileCard}>
          <h2 className={styles.cardTitle}>Security</h2>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Password</label>
            {isEditing ? (
              <input
                className={styles.fieldInput}
                type="password"
                placeholder="Leave blank to keep current"
              />
            ) : (
              <div className={styles.fieldValue}>••••••••</div>
            )}
          </div>

          <p style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}>
            Password changes require additional verification
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.profileActions}>
          {!isEditing ? (
            <>
              <button
                className={styles.primaryButton}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button className={styles.secondaryButton} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.secondaryButton}
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
