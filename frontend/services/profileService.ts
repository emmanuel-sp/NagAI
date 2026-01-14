import { UserProfile } from "@/types/user";
import { getCurrentUser } from "./authService";
import { apiRequest } from "@/lib/api";

export async function fetchUserProfile(): Promise<UserProfile | null> {
  return await getCurrentUser();
}

export async function updateUserProfile(profile: UserProfile): Promise<UserProfile> {
  const profileUpdate = await apiRequest<UserProfile>("/users/me", {
      method: "PUT",
      body: JSON.stringify(profile)
    });
  
  return profileUpdate;
}

export async function updatePassword(_currentPassword: string, _newPassword: string): Promise<boolean> {
  const updated = await apiRequest<boolean>("users/me/password", {
      method: "PUT",
      body: JSON.stringify({currentPassword: _currentPassword, newPassword: _newPassword})
    });
  
  return updated;
}
