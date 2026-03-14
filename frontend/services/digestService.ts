import { apiRequest } from "@/lib/api";
import { Digest, CreateDigestRequest, UpdateDigestRequest } from "@/types/digest";

export async function fetchDigest(): Promise<Digest> {
  return apiRequest<Digest>("/digest");
}

export async function createDigest(data: CreateDigestRequest): Promise<Digest> {
  return apiRequest<Digest>("/digest", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDigest(updates: UpdateDigestRequest): Promise<Digest> {
  return apiRequest<Digest>("/digest", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function toggleDigestStatus(): Promise<Digest> {
  return apiRequest<Digest>("/digest/toggle", { method: "PATCH" });
}

