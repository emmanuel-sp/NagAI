/** CommunicationSettings Component - Communication channel selection (email/phone). Parent: AgentBuilderContainer */
"use client";
import { CommunicationChannel } from "@/types/agent";
import { IoMail, IoCall } from "@/components/icons";
import styles from "./agent-builder.module.css";

interface CommunicationSettingsProps {
  currentChannel: CommunicationChannel;
  onChannelChange: (channel: CommunicationChannel) => void;
}

export default function CommunicationSettings({
  currentChannel,
  onChannelChange,
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
        </button>

        <button
          disabled
          className={`${styles.channelButton} ${styles.channelButtonDisabled}`}
        >
          <IoCall size={24} />
          <span>Phone</span>
          <span className={styles.comingSoonBadge}>Coming Soon</span>
        </button>
      </div>
    </div>
  );
}
