import { User, LoginCredentials, SignupData } from "@/types/user";

export async function login(credentials: LoginCredentials): Promise<User> {
  // API call here
  // const response = await apiRequest<AuthResponse>("/auth/login", {
  //   method: "POST",
  //   body: credentials,
  // });
  // localStorage.setItem("authToken", response.token);
  // localStorage.setItem("user", JSON.stringify(response.user));
  // return response.user;

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  const user: User = {
    id: `user-${Date.now()}`,
    email: credentials.email,
    name: credentials.email.split("@")[0],
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", "mock-token-" + Date.now());
    localStorage.setItem("user", JSON.stringify(user));
  }
  return user;
  // Dummy data
}

export async function signup(data: SignupData): Promise<User> {
  // API call here
  // const response = await apiRequest<AuthResponse>("/auth/signup", {
  //   method: "POST",
  //   body: data,
  // });
  // localStorage.setItem("authToken", response.token);
  // localStorage.setItem("user", JSON.stringify(response.user));
  // return response.user;

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  const user: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", "mock-token-" + Date.now());
    localStorage.setItem("user", JSON.stringify(user));
  }
  return user;
  // Dummy data
}

export async function logout(): Promise<void> {
  // API call here
  // await apiRequest("/auth/logout", { method: "POST" });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 200));
  // Dummy data

  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userProfile");
  }
}

export async function getCurrentUser(): Promise<User | null> {
  // API call here
  // try {
  //   const user = await apiRequest<User>("/auth/me");
  //   localStorage.setItem("user", JSON.stringify(user));
  //   return user;
  // } catch {
  //   localStorage.removeItem("authToken");
  //   localStorage.removeItem("user");
  //   return null;
  // }

  // Dummy data
  if (typeof window === "undefined") {
    return null;
  }
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
  // Dummy data
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
