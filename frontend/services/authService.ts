import { apiRequest, ApiError } from "@/lib/api";
import { User, LoginCredentials, SignupData, LoginResponse } from "@/types/user";

export async function login(credentials: LoginCredentials): Promise<void> {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", response.token);
  }
}

export async function signup(data: SignupData): Promise<void> {
  await apiRequest<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  // No auto-login — user must verify their email first
}

export async function verifyEmail(token: string): Promise<void> {
  await apiRequest<void>(`/auth/verify?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiRequest<User>("/users/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      // Genuine auth failure — clear stale token
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
      }
      return null;
    }
    // Server/network error — rethrow so callers can distinguish from "not authenticated"
    throw error;
  }
}

export async function loginWithGoogle(idToken: string): Promise<void> {
  const response = await apiRequest<LoginResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", response.token);
  }
}
