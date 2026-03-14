export type DigestFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export type DeliveryTime = "morning" | "afternoon" | "evening";

export type DigestContentType =
  | "affirmations"
  | "news"
  | "knowledge_snippets"
  | "tips"
  | "motivational_quotes"
  | "resource_recommendations"
  | "progress_insights"
  | "reflection_prompts";

export interface Digest {
  digestId: number;
  name: string;
  description: string;
  frequency: DigestFrequency;
  deliveryTime: DeliveryTime;
  contentTypes: DigestContentType[];
  active: boolean;
  createdAt: string;
  lastDeliveredAt?: string;
  nextDeliveryAt?: string;
}

export interface CreateDigestRequest {
  name: string;
  description: string;
  frequency: DigestFrequency;
  deliveryTime: DeliveryTime;
  contentTypes: DigestContentType[];
}

export interface UpdateDigestRequest extends CreateDigestRequest {}
