/**
 * Home Page
 *
 * Shows landing page for logged-out users or dashboard for logged-in users
 */

"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@/types/user";
import LandingPage from "@/components/home/LandingPage";
import DashboardContainer from "@/components/dashboard/DashboardContainer";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getCurrentUser } from "@/services/authService";

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUserProfile = await getCurrentUser();
      setUserProfile(currentUserProfile);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return userProfile ? <DashboardContainer userProfile={userProfile} /> : <LandingPage />;
}
