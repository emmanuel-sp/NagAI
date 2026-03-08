/**
 * Agent Builder Type Definitions
 */

export type MessageType = "nag" | "motivation" | "guidance";
export type MessageFrequency = "daily" | "twice-daily" | "weekly" | "bi-weekly";
export type CommunicationChannel = "email" | "phone";

export interface AgentContext {
  contextId: number;
  agentId: number;
  name: string;
  goalId?: number | null;
  goalName?: string | null;
  messageType: MessageType;
  messageFrequency: MessageFrequency;
  customInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  agentId: number;
  userId: number;
  name: string;
  deployed: boolean;
  communicationChannel: CommunicationChannel;
  contexts: AgentContext[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContextRequest {
  name: string;
  goalId?: number | null;
  messageType: MessageType;
  messageFrequency: MessageFrequency;
  customInstructions?: string;
}

export interface UpdateContextRequest {
  name?: string;
  goalId?: number | null;
  messageType?: MessageType;
  messageFrequency?: MessageFrequency;
  customInstructions?: string;
}
