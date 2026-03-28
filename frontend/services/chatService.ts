import { apiRequest } from "@/lib/api";
import {
  ChatMessage,
  ChatSession,
  SendMessageRequest,
  SendMessageResponse,
} from "@/types/chat";

export async function sendMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  return await apiRequest<SendMessageResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function fetchSessions(): Promise<ChatSession[]> {
  return await apiRequest<ChatSession[]>("/chat/sessions");
}

export async function fetchSessionMessages(
  sessionId: number
): Promise<ChatMessage[]> {
  return await apiRequest<ChatMessage[]>(
    `/chat/sessions/${sessionId}/messages`
  );
}

export async function deleteSession(sessionId: number): Promise<void> {
  await apiRequest(`/chat/sessions/${sessionId}`, { method: "DELETE" });
}

export async function fetchContextSummary(
  contextId: number
): Promise<string> {
  const result = await apiRequest<{ summary: string }>(
    `/chat/context-summary/${contextId}`
  );
  return result.summary;
}
