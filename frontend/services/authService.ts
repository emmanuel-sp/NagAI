import { apiRequest } from "@/lib/api";
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

export async function signup(data: SignupData): Promise<User> {
  const user = await apiRequest<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });

  return user;
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await apiRequest<User>("/users/me");
    return user;
  } catch (error) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
