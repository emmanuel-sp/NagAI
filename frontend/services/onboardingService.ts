import { UserProfile } from "@/types/user";
import { apiRequest } from "@/lib/api";

export async function completeOnboarding(profile: Partial<UserProfile>): Promise<UserProfile> {
  return apiRequest<UserProfile>("/users/me/onboarding/complete", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function skipOnboarding(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/users/me/onboarding/skip", {
    method: "POST",
  });
}
