import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/services/authService";
import { updateUserProfile } from "@/services/profileService";
import { UserProfile } from "@/types/user";

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectIfAuth?: boolean;
}

let timezoneSynced = false;

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function useAuth(options: UseAuthOptions = {}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Fast path: if redirectIfAuth and a token exists, redirect immediately
    // before any async work so the user never glimpses the page
    if (options.redirectIfAuth) {
      const hasToken = !!localStorage.getItem("authToken");
      if (hasToken) {
        router.replace("/home");
        return; // keep loading=true so nothing renders
      }
    }

    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);

      if (options.requireAuth && !currentUser) {
        router.push("/login");
      }

      if (options.redirectIfAuth && currentUser) {
        router.replace("/home");
      }

      // Onboarding gate: redirect un-onboarded users to /onboarding
      if (options.requireAuth && currentUser && !currentUser.onboardingCompleted && pathname !== "/onboarding") {
        router.replace("/onboarding");
      }

      // Auto-sync browser timezone to backend (once per session)
      if (currentUser && !timezoneSynced) {
        timezoneSynced = true;
        const browserTz = getBrowserTimezone();
        if (browserTz && browserTz !== currentUser.timezone) {
          updateUserProfile({ ...currentUser, timezone: browserTz }).catch(() => {});
        }
      }
    };

    checkAuth();
  }, [options.requireAuth, options.redirectIfAuth, router, pathname]);

  return { user, loading };
}
