export interface ChatMessage {
  messageId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  sessionId: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessageDetail {
  sentMessageId: number;
  subject: string;
  content: string;
  contextName: string;
  sentAt: string;
}

export interface SendMessageRequest {
  sessionId?: number;
  message: string;
  fromContextSummary?: string;
}

export interface SendMessageResponse {
  sessionId: number;
  messageId: number;
  content: string;
  sessionTitle: string;
}
