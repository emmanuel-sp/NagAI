/**
 * Home Page (Dashboard)
 *
 * Authenticated dashboard at /home. Redirects to /login if not authenticated.
 */

"use client";

import { useAuth } from "@/hooks/useAuth";
import DashboardContainer from "@/components/dashboard/DashboardContainer";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function HomePage() {
  const { user, loading } = useAuth({ requireAuth: true });

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return <DashboardContainer userProfile={user} />;
}
