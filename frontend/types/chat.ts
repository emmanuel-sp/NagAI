export interface QuizOption {
  label: string;
  description?: string;
}

export interface QuizParams {
  question: string;
  options: QuizOption[];
  allowFreeResponse: boolean;
  freeResponsePlaceholder?: string;
}

export interface ActionSuggestion {
  suggestionId: string;
  type:
    | "create_goal"
    | "update_goal"
    | "add_checklist_item"
    | "complete_checklist_item"
    | "quiz";
  displayText: string;
  paramsJson: string;
  status: "pending" | "accepted" | "rejected";
}

export interface ChatMessage {
  messageId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestions?: ActionSuggestion[];
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
  suggestions?: ActionSuggestion[];
}
