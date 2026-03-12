"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import ConditionalFooter from "@/components/ConditionalFooter";
import { getCurrentUser } from "@/services/authService";
import { ModalProvider } from "@/contexts/ModalContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import styles from "./PagePane.module.css";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showNavbar, setShowNavbar] = useState<boolean | null>(null);

  useEffect(() => {
    // Synchronous localStorage check first — eliminates the layout flash
    const hasToken = !!localStorage.getItem("authToken");
    setShowNavbar(hasToken);
    // Then validate with the API in case the token is expired
    getCurrentUser().then((user) => setShowNavbar(!!user));
  }, [pathname]);

  // Landing page never gets pane wrapper or navbar padding, even for authenticated users
  const isLandingPage = pathname === "/";
  const isProfilePage = pathname === "/profile";
  // Treat null (SSR / unknown) same as false so the landing page renders correctly
  const paddingTop = showNavbar && !isLandingPage ? "112px" : "0";
  const usePane = showNavbar === true && !isLandingPage && !isProfilePage;

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <ModalProvider>
        <NavBar />
        <main style={{ flex: 1, paddingTop, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {usePane ? (
            <div className={styles.pane}>{children}</div>
          ) : (
            children
          )}
        </main>
        <ConditionalFooter />
      </ModalProvider>
    </GoogleOAuthProvider>
  );
}
