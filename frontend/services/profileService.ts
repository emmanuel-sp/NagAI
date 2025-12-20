// Profile service stub - will be connected to backend API

export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  career: string;
  location: string;
  interests: string[];
  hobbies: string[];
  habits: string[];
}

/**
 * Fetch user profile from backend
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Try to get from localStorage first (stub behavior)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      try {
        return JSON.parse(stored) as UserProfile;
      } catch {
        // Fall through to default
      }
    }
  }

  // Stub: Return default profile if nothing stored
  return {
    name: "John Doe",
    email: "john@example.com",
    bio: "Passionate about personal growth and technology.",
    career: "Software Engineer",
    location: "San Francisco, CA",
    interests: ["AI", "Machine Learning", "Web Development"],
    hobbies: ["Reading", "Gaming", "Photography"],
    habits: ["Morning meditation", "Daily journaling", "Exercise"],
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  profile: UserProfile
): Promise<UserProfile> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Stub: Save to localStorage for now
  if (typeof window !== "undefined") {
    localStorage.setItem("userProfile", JSON.stringify(profile));
  }

  return profile;
}

/**
 * Update password (requires additional verification)
 */
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Stub: Return success
  return true;
}
