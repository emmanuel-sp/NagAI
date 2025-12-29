/** CommunicationSettings Component - Communication channel selection (email/phone). Parent: AgentBuilderContainer */
"use client";
import { CommunicationChannel } from "@/types/agent";
import { IoMail, IoCall } from "react-icons/io5";
import styles from "@/styles/agent/agent-builder.module.css";

interface CommunicationSettingsProps {
  currentChannel: CommunicationChannel;
  onChannelChange: (channel: CommunicationChannel) => void;
  hasPhoneNumber: boolean;
}

export default function CommunicationSettings({
  currentChannel,
  onChannelChange,
  hasPhoneNumber,
}: CommunicationSettingsProps) {
  return (
    <div className={styles.settingsCard}>
      <h2 className={styles.cardTitle}>Communication Preferences</h2>
      <p className={styles.cardSubtitle}>
        Choose how your agent will reach out to you. Email and phone settings can be updated in your profile.
      </p>

      <div className={styles.channelOptions}>
        <button
          onClick={() => onChannelChange("email")}
          className={`${styles.channelButton} ${
            currentChannel === "email" ? styles.channelButtonActive : ""
          }`}
        >
          <IoMail size={24} />
          <span>Email</span>
          {currentChannel === "email" && <span className={styles.checkmark}>✓</span>}
        </button>

        <button
          onClick={() => hasPhoneNumber && onChannelChange("phone")}
          disabled={!hasPhoneNumber}
          className={`${styles.channelButton} ${
            currentChannel === "phone" ? styles.channelButtonActive : ""
          }`}
        >
          <IoCall size={24} />
          <span>{hasPhoneNumber ? "Phone" : "Add phone in profile"}</span>
          {currentChannel === "phone" && <span className={styles.checkmark}>✓</span>}
        </button>
      </div>
    </div>
  );
}
