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
