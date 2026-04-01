/** DigestSettings Component - Frequency and delivery time configuration */
"use client";

import { DigestFrequency, DeliveryTime } from "@/types/digest";
import styles from "./digest-builder.module.css";

interface DigestSettingsProps {
  frequency: DigestFrequency;
  deliveryTime: DeliveryTime;
  onFrequencyChange: (frequency: DigestFrequency) => void;
  onDeliveryTimeChange: (deliveryTime: DeliveryTime) => void;
}

export default function DigestSettings({
  frequency,
  deliveryTime,
  onFrequencyChange,
  onDeliveryTimeChange,
}: DigestSettingsProps) {
  const frequencies: { value: DigestFrequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Biweekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const deliveryTimes: { value: DeliveryTime; label: string; time: string }[] = [
    { value: "morning", label: "Morning", time: "8:00 AM" },
    { value: "afternoon", label: "Afternoon", time: "2:00 PM" },
    { value: "evening", label: "Evening", time: "7:00 PM" },
  ];

  return (
    <div className={styles.settingsCard}>
      <h2 className={styles.cardTitle}>Digest Settings</h2>
      <p className={styles.cardSubtitle}>
        Set the rhythm so your digest lands when it can actually be useful.
      </p>

      <div className={styles.settingSection}>
        <h3 className={styles.settingLabel}>Delivery Frequency</h3>
        <div className={styles.frequencyOptions}>
          {frequencies.map((freq) => (
            <button
              key={freq.value}
              type="button"
              onClick={() => onFrequencyChange(freq.value)}
              aria-pressed={frequency === freq.value}
              className={`${styles.frequencyButton} ${
                frequency === freq.value ? styles.frequencyButtonActive : ""
              }`}
            >
              {freq.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.settingSection}>
        <h3 className={styles.settingLabel}>Delivery Time</h3>
        <div className={styles.timeOptions}>
          {deliveryTimes.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() => onDeliveryTimeChange(time.value)}
              aria-pressed={deliveryTime === time.value}
              className={`${styles.timeButton} ${
                deliveryTime === time.value ? styles.timeButtonActive : ""
              }`}
            >
              <div className={styles.timeLabel}>{time.label}</div>
              <div className={styles.timeValue}>{time.time}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
