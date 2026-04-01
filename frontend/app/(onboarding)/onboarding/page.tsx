"use client";

import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useAuthenticatedUser } from "@/components/layout/AuthGate";

export default function OnboardingPage() {
  const user = useAuthenticatedUser();

  return <OnboardingWizard user={user} />;
}
