"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { Goal } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import { Digest } from "@/types/digest";
import { fetchGoals } from "@/services/goalService";
import { fetchChecklists } from "@/services/checklistService";
import { fetchDigest } from "@/services/digestService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "./DashboardHeader";
import DailyChecklistPreview from "./DailyChecklistPreview";
import GoalProgressCards from "./GoalProgressCards";
import SystemStatusRow from "./SystemStatusRow";
import styles from "./dashboard.module.css";

interface DashboardContainerProps {
  userProfile: UserProfile;
}

export default function DashboardContainer({ userProfile }: DashboardContainerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [goalsData, checklistsData, digestData] = await Promise.all([
        fetchGoals(),
        fetchChecklists(),
        fetchDigest().catch(() => null),
      ]);

      setGoals(goalsData);
      setChecklists(checklistsData);
      setDigest(digestData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        <DashboardHeader userName={userProfile.fullName.split(" ")[0]} />
        <DailyChecklistPreview />
        <GoalProgressCards goals={goals} checklists={checklists} />
        <SystemStatusRow digest={digest} />
      </div>
    </div>
  );
}
