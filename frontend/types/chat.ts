// Chat types shared across components

export interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  goalContext?: string[]; // IDs of goals referenced in this message
}

export interface ChatSession {
  id: string;
  date: string;
  label: string;
  preview?: string;
  messages?: Message[];
}

export interface Goal {
  id: string;
  name: string;
  title?: string; // Support both formats for compatibility
}
