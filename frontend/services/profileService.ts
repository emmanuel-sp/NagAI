import { UserProfile } from "@/types/user";
import { getCurrentUser } from "./authService";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  return await getCurrentUser();
}

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  // TODO: Implement backend endpoint for updating user profile
  // For now, return the profile as-is since backend doesn't have update endpoint yet
  await new Promise((resolve) => setTimeout(resolve, 500));
  return profile;
}

export async function updatePassword(_currentPassword: string, _newPassword: string): Promise<boolean> {
  // TODO: Implement backend endpoint for updating password
  // For now, return true since backend doesn't have this endpoint yet
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
}
