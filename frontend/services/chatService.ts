// Chat service stub - will be connected to backend API

import { Message, ChatSession } from "@/types/chat";
import { MOCK_CHAT_SESSIONS } from "@/lib/mockData";

/**
 * Send a message to the AI and get a response
 */
export async function sendMessage(
  content: string,
  sessionId: string,
  goalContext?: string[]
): Promise<Message> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Stub: Return a mock AI response
  const mockResponses = [
    "That's a great goal! Let me help you break it down into actionable steps.",
    "I can help you stay on track with that. Would you like me to set up reminders?",
    "Excellent progress! Keep up the momentum.",
    "Based on your goals, I'd suggest focusing on consistency over perfection.",
    "That aligns well with your other objectives. Let's make sure you're allocating enough time.",
    "Great question! Let me provide some insights on that.",
  ];

  const randomResponse =
    mockResponses[Math.floor(Math.random() * mockResponses.length)];

  return {
    id: `ai-${Date.now()}`,
    type: "ai",
    content: randomResponse,
    timestamp: new Date(),
    goalContext,
  };
}

/**
 * Fetch chat history/sessions
 */
export async function fetchChatSessions(): Promise<ChatSession[]> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Stub: Return mock sessions
  return [...MOCK_CHAT_SESSIONS];
}

/**
 * Fetch messages for a specific chat session
 */
export async function fetchChatMessages(
  sessionId: string
): Promise<Message[]> {
  // TODO: Replace with actual API call to backend using sessionId
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Stub: Return empty array (messages loaded from session)
  // In real implementation, this would fetch historical messages for sessionId
  console.log(`Fetching messages for session: ${sessionId}`);
  return [];
}

/**
 * Create a new chat session
 */
export async function createChatSession(): Promise<ChatSession> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Stub: Return new session
  return {
    id: `session-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    label: "New Chat",
  };
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Stub: Return success
  return true;
}
