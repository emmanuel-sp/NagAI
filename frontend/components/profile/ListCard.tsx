/**
 * ListCard Component - Reusable card for displaying and editing lists (interests, hobbies, habits).
 * Parent: ProfileContent (via InterestsCard, HobbiesCard, HabitsCard)
 */

"use client";

import { useState } from "react";
import { IoClose } from "react-icons/io5";
import styles from "@/styles/pages/profile.module.css";

interface ListCardProps {
  title: string;
  subtitle: string;
  items: string[];
  isEditing: boolean;
  placeholder: string;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export default function ListCard({ title, subtitle, items, isEditing, placeholder, onAdd, onRemove }: ListCardProps) {
  const [tempInput, setTempInput] = useState("");

  const handleAdd = () => {
    if (tempInput.trim()) {
      onAdd(tempInput);
      setTempInput("");
    }
  };

  return (
    <div className={styles.profileCard}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardSubtitle}>{subtitle}</p>

      {items.length > 0 && (
        <div className={styles.bulkItems}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.bulkItem}>
              {item}
              {isEditing && (
                <span className={styles.bulkItemRemove} onClick={() => onRemove(idx)}>
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
            placeholder={placeholder}
            value={tempInput}
            onChange={(e) => setTempInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAdd()}
          />
          <button className={styles.addButton} onClick={handleAdd} style={{ marginTop: "8px" }}>
            Add {title.slice(0, -1)}
          </button>
        </div>
      )}
    </div>
  );
}
