/**
 * Agent Builder Type Definitions
 */

export type MessageType = "nag" | "motivation" | "guidance";
export type CommunicationChannel = "email" | "phone";

export interface AgentContext {
  contextId: number;
  agentId: number;
  name: string;
  goalId?: number | null;
  goalName?: string | null;
  messageType: MessageType;
  customInstructions?: string | null;
  deployed: boolean;
  lastMessageSentAt?: string | null;
  nextMessageAt?: string | null;
  staleCount: number;
  pauseReason?: string | null;
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
  goalId: number;
  messageType: MessageType;
  customInstructions?: string;
}

export interface UpdateContextRequest {
  name?: string;
  goalId: number;
  messageType?: MessageType;
  customInstructions?: string;
}
