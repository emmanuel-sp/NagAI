"use client";

import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import TodayContainer from "@/components/checklists/TodayContainer";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function TodayPage() {
  const { user, loading } = useAuth({ requireAuth: true });

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <TodayContainer />
    </Suspense>
  );
}
