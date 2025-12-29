/**
 * DashboardHeader - Welcome header for dashboard
 */
"use client";

import styles from "@/styles/pages/dashboard.module.css";

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

  return (
    <div className={styles.header}>
      <h1 className={styles.greeting}>
        {getGreeting()}, {userName}
      </h1>
      <p className={styles.subtitle}>Here's your progress overview</p>
    </div>
  );
}
