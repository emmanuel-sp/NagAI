"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import ConditionalFooter from "@/components/ConditionalFooter";
import { ModalProvider } from "@/contexts/ModalContext";
import { AgentDataProvider } from "@/contexts/AgentDataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import styles from "./LayoutClient.module.css";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showNavbar, setShowNavbar] = useState<boolean | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("authToken");
    setShowNavbar(hasToken);
  }, [pathname]);

  const isLandingPage = pathname === "/";
  const isOnboardingPage = pathname === "/onboarding";
  const hasSidebar = showNavbar === true && !isLandingPage && !isOnboardingPage;
  const isLoggedIn = showNavbar === true;

  const mainClass = !hasSidebar
    ? styles.main
    : sidebarCollapsed
      ? styles.mainCollapsed
      : styles.mainWithSidebar;

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <ThemeProvider>
      <ModalProvider>
        <AgentDataProvider isLoggedIn={isLoggedIn}>
          <NavBar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className={mainClass}>
            {children}
          </main>
          <ConditionalFooter />
        </AgentDataProvider>
      </ModalProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
