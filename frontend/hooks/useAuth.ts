import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/services/authService";
import { UserProfile } from "@/types/user";

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectIfAuth?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);

      if (options.requireAuth && !currentUser) {
        router.push("/login");
      }

      if (options.redirectIfAuth && currentUser) {
        router.push("/");
      }
    };

    checkAuth();
  }, [options.requireAuth, options.redirectIfAuth, router]);

  return { user, loading };
}
