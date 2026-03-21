"use client";

import { useAuth } from "@/hooks/useAuth";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function OnboardingPage() {
  const { user, loading } = useAuth({ requireAuth: true });

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return <OnboardingWizard user={user} />;
}
