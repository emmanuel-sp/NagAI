// Authentication service stub - will be connected to backend API

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Stub: Return mock user data
  const user: User = {
    id: `user-${Date.now()}`,
    email: credentials.email,
    name: credentials.email.split("@")[0], // Extract name from email for demo
  };

  // Store in localStorage for now (will be replaced with JWT/session)
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }

  return user;
}

/**
 * Register a new user
 */
export async function signup(data: SignupData): Promise<User> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Stub: Return mock user data
  const user: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
  };

  // Store in localStorage for now (will be replaced with JWT/session)
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }

  return user;
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  // TODO: Replace with actual API call to backend to invalidate session
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Clear local storage
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
    localStorage.removeItem("userProfile");
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  // TODO: Replace with actual API call to backend to verify session
  // For now, get from localStorage
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
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
