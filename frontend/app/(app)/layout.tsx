import LayoutClient from "@/components/LayoutClient";
import AuthGate from "@/components/layout/AuthGate";
import { ModalProvider } from "@/contexts/ModalContext";
import { AgentDataProvider } from "@/contexts/AgentDataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ThemeProvider>
      <AuthGate>
        <ModalProvider>
          <AgentDataProvider isLoggedIn={true}>
            <LayoutClient>{children}</LayoutClient>
          </AgentDataProvider>
        </ModalProvider>
      </AuthGate>
    </ThemeProvider>
  );
}
