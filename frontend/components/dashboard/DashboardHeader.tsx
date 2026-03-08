/**
 * DashboardHeader - Welcome header for dashboard
 */
"use client";

import styles from "./dashboard.module.css";

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.header}>
      <span className={styles.dateLine}>{today}</span>
      <h1 className={styles.greeting}>
        {getGreeting()}, {userName}
      </h1>
    </div>
  );
}
