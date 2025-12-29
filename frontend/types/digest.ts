export type DigestFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export type DeliveryTime = "morning" | "afternoon" | "evening";

export type DigestContentType =
  | "nearby_opportunities"
  | "affirmations"
  | "news"
  | "knowledge_snippets"
  | "tips"
  | "motivational_quotes"
  | "resource_recommendations"
  | "progress_insights";

export interface Digest {
  id: string;
  name: string;
  description: string;
  frequency: DigestFrequency;
  deliveryTime: DeliveryTime;
  contentTypes: DigestContentType[];
  isActive: boolean;
  createdAt: Date;
  lastDeliveredAt?: Date;
  nextDeliveryAt?: Date;
}

export interface CreateDigestRequest {
  name: string;
  description: string;
  frequency: DigestFrequency;
  deliveryTime: DeliveryTime;
  contentTypes: DigestContentType[];
}

export interface UpdateDigestRequest extends CreateDigestRequest {}
