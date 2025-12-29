/**
 * DashboardContainer - Main dashboard for logged-in users
 */
"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { Goal } from "@/types/goal";
import { Checklist } from "@/types/checklist";
import { Digest } from "@/types/digest";
import { Agent } from "@/types/agent";
import { fetchGoals } from "@/services/goalService";
import { fetchChecklists } from "@/services/checklistService";
import { fetchDigest } from "@/services/digestService";
import { fetchAgent } from "@/services/agentService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "./DashboardHeader";
import DashboardOverview from "./DashboardOverview";
import styles from "@/styles/pages/dashboard.module.css";

interface DashboardContainerProps {
  userProfile: UserProfile;
}

export default function DashboardContainer({ userProfile }: DashboardContainerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [goalsData, checklistsData, digestData, agentData] = await Promise.all([
        fetchGoals(),
        fetchChecklists(),
        fetchDigest().catch(() => null),
        fetchAgent().catch(() => null),
      ]);

      setGoals(goalsData);
      setChecklists(checklistsData);
      setDigest(digestData);
      setAgent(agentData);
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
        <DashboardHeader userName={userProfile.name} />
        <DashboardOverview
          goals={goals}
          checklists={checklists}
          digest={digest}
          agent={agent}
        />
      </div>
    </div>
  );
}
