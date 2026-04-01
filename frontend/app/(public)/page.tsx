/**
 * Root Page
 *
 * Always shows the landing page, regardless of auth state.
 * Logged-in users see direct links back into the product from here.
 */

import LandingPage from "@/components/home/LandingPage";

export const metadata = {
  title: "NagAI - Personalized Accountability OS",
  description:
    "Turn goals into daily execution with onboarding-driven AI planning, daily plans, proactive accountability, inbox history, and follow-up chat.",
};

export default function RootPage() {
  return <LandingPage />;
}
