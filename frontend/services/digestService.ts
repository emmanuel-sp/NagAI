import { Digest, CreateDigestRequest, UpdateDigestRequest } from "@/types/digest";

// Dummy data
const mockDigest: Digest = {
  id: "digest-1",
  name: "My Growth Digest",
  description: "Daily insights and opportunities to help me achieve my goals",
  frequency: "daily",
  deliveryTime: "morning",
  contentTypes: [
    "affirmations",
    "knowledge_snippets",
    "tips",
    "motivational_quotes",
  ],
  isActive: true,
  createdAt: new Date("2024-01-15"),
  lastDeliveredAt: new Date("2024-01-20T08:00:00"),
  nextDeliveryAt: new Date("2024-01-21T08:00:00"),
};
// Dummy data

export async function fetchDigest(): Promise<Digest> {
  // API call here
  // return await apiRequest<Digest>("/digest");

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockDigest;
  // Dummy data
}

export async function createDigest(
  digestData: CreateDigestRequest
): Promise<Digest> {
  // API call here
  // return await apiRequest<Digest>("/digest", {
  //   method: "POST",
  //   body: digestData,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newDigest: Digest = {
    id: `digest-${Date.now()}`,
    ...digestData,
    isActive: false,
    createdAt: new Date(),
  };
  return newDigest;
  // Dummy data
}

export async function updateDigest(
  digestId: string,
  updates: UpdateDigestRequest
): Promise<Digest> {
  // API call here
  // return await apiRequest<Digest>(`/digest/${digestId}`, {
  //   method: "PATCH",
  //   body: updates,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    ...mockDigest,
    ...updates,
  };
  // Dummy data
}

export async function toggleDigestStatus(digestId: string): Promise<Digest> {
  // API call here
  // return await apiRequest<Digest>(`/digest/${digestId}/toggle`, {
  //   method: "PATCH",
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    ...mockDigest,
    isActive: !mockDigest.isActive,
  };
  // Dummy data
}

export async function deleteDigest(digestId: string): Promise<void> {
  // API call here
  // await apiRequest(`/digest/${digestId}`, {
  //   method: "DELETE",
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Dummy data
}
