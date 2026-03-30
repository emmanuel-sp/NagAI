import { apiRequest } from "@/lib/api";
import {
  Agent,
  AgentContext,
  CreateContextRequest,
  UpdateContextRequest,
  CommunicationChannel,
} from "@/types/agent";

export async function fetchAgent(): Promise<Agent> {
  return await apiRequest<Agent>("/agent");
}

export async function createContext(contextData: CreateContextRequest): Promise<AgentContext> {
  return await apiRequest<AgentContext>("/agent/contexts", {
    method: "POST",
    body: JSON.stringify(contextData),
  });
}

export async function updateContext(
  contextId: number,
  updates: UpdateContextRequest
): Promise<AgentContext> {
  return await apiRequest<AgentContext>(`/agent/contexts/${contextId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteContext(contextId: number): Promise<void> {
  await apiRequest(`/agent/contexts/${contextId}`, { method: "DELETE" });
}

export async function deployContext(contextId: number): Promise<AgentContext> {
  return await apiRequest<AgentContext>(`/agent/contexts/${contextId}/deploy`, {
    method: "POST",
  });
}

export async function stopContext(contextId: number): Promise<AgentContext> {
  return await apiRequest<AgentContext>(`/agent/contexts/${contextId}/stop`, {
    method: "POST",
  });
}

export async function deployAgent(): Promise<Agent> {
  return await apiRequest<Agent>("/agent/deploy", { method: "POST" });
}

export async function stopAgent(): Promise<Agent> {
  return await apiRequest<Agent>("/agent/stop", { method: "POST" });
}

export async function updateAgentCommunication(channel: CommunicationChannel): Promise<Agent> {
  return await apiRequest<Agent>("/agent/communication", {
    method: "PUT",
    body: JSON.stringify({ channel }),
  });
}
