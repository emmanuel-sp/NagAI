"use client";

import DashboardContainer from "@/components/dashboard/DashboardContainer";
import { useAuthenticatedUser } from "@/components/layout/AuthGate";

export default function HomePage() {
  const user = useAuthenticatedUser();

  return <DashboardContainer userProfile={user} />;
}
