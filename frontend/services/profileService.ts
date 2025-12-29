import { UserProfile } from "@/types/user";
import { getCurrentUser } from "./authService";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  // API call here
  const user = await getCurrentUser();
  // return await apiRequest<UserProfile>("/profile", {
  // method: "GET",
  // body: user.id});

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      try {
        return JSON.parse(stored) as UserProfile;
      } catch {}
    }
  }
  return user ? {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    phone: undefined,
    bio: "Passionate about personal growth and technology.",
    career: "Software Engineer",
    location: "San Francisco, CA",
    interests: ["AI", "Machine Learning", "Web Development"],
    hobbies: ["Reading", "Gaming", "Photography"],
    habits: ["Morning meditation", "Daily journaling", "Exercise"],
  } : null;
  // Dummy data
}

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  // API call here
  // return await apiRequest<UserProfile>("/profile", {
  //   method: "PATCH",
  //   body: profile,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (typeof window !== "undefined") {
    localStorage.setItem("userProfile", JSON.stringify(profile));
  }
  return profile;
  // Dummy data
}

export async function updatePassword(_currentPassword: string, _newPassword: string): Promise<boolean> {
  // API call here
  // await apiRequest("/profile/password", {
  //   method: "POST",
  //   body: { currentPassword, newPassword },
  // });
  // return true;

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
  // Dummy data
}
