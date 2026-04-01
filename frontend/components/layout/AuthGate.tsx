"use client";

import { createContext, useContext } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/user";

const AuthenticatedUserContext = createContext<UserProfile | null>(null);

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading, backendError } = useAuth({ requireAuth: true });

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        {backendError ? (
          <p style={{ maxWidth: "32rem", textAlign: "center", color: "var(--text-secondary)" }}>
            We couldn&apos;t reach the server right now. Please refresh and try again.
          </p>
        ) : (
          <LoadingSpinner />
        )}
      </div>
    );
  }

  return (
    <AuthenticatedUserContext.Provider value={user}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}

export function useAuthenticatedUser() {
  const user = useContext(AuthenticatedUserContext);

  if (!user) {
    throw new Error("useAuthenticatedUser must be used within AuthGate");
  }

  return user;
}
