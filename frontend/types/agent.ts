/**
 * Agent Builder Type Definitions
 */

export type MessageType = "nag" | "motivation" | "guidance";
export type MessageFrequency = "daily" | "twice-daily" | "weekly" | "bi-weekly";
export type CommunicationChannel = "email" | "phone";

export interface AgentContext {
  id: string;
  name: string;
  goalId: string;
  goalName?: string; // For display purposes
  messageType: MessageType;
  messageFrequency: MessageFrequency;
  customInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  isDeployed: boolean;
  communicationChannel: CommunicationChannel;
  contexts: AgentContext[];
  createdAt: Date;
  deployedAt?: Date;
  lastUpdatedAt: Date;
}

export interface CreateContextRequest {
  name: string;
  goalId: number;
  messageType: MessageType;
  messageFrequency: MessageFrequency;
  customInstructions?: string;
}

export interface UpdateContextRequest {
  name?: string;
  goalId?: number;
  messageType?: MessageType;
  messageFrequency?: MessageFrequency;
  customInstructions?: string;
}
