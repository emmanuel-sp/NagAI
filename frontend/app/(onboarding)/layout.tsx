import AuthGate from "@/components/layout/AuthGate";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <ThemeProvider>
      <AuthGate>{children}</AuthGate>
    </ThemeProvider>
  );
}
