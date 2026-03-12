/**
 * Root Page
 *
 * Always shows the landing page, regardless of auth state.
 * Logged-in users are auto-redirected to /home on first load (handled by LayoutClient).
 */

import LandingPage from "@/components/home/LandingPage";

export const metadata = {
  title: "NagAI - AI-Powered Accountability",
  description:
    "Turn your goals into action with intelligent nudges, daily digests, and an AI agent that holds you accountable.",
};

export default function RootPage() {
  return <LandingPage />;
}
