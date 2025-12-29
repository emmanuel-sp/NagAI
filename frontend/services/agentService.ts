import {
  Agent,
  AgentContext,
  CreateContextRequest,
  UpdateContextRequest,
  CommunicationChannel,
} from "@/types/agent";

// Dummy data
const mockContexts: AgentContext[] = [
  {
    id: "context-1",
    name: "Morning Motivation",
    goalId: "goal-1",
    goalName: "Learn TypeScript",
    messageType: "motivation",
    messageFrequency: "daily",
    customInstructions: "Keep messages short and energetic. Focus on daily wins.",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "context-2",
    name: "Weekly Progress Check",
    goalId: "goal-2",
    goalName: "Build a SaaS Product",
    messageType: "guidance",
    messageFrequency: "weekly",
    customInstructions: "Provide strategic advice on product development.",
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
  {
    id: "context-3",
    name: "Workout Reminder",
    goalId: "goal-3",
    goalName: "Get Fit",
    messageType: "nag",
    messageFrequency: "twice-daily",
    customInstructions: "Be persistent but supportive about exercise.",
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-17"),
  },
];

const mockAgent: Agent = {
  id: "agent-1",
  userId: "user-1",
  name: "My Personal Agent",
  isDeployed: false,
  communicationChannel: "email",
  contexts: mockContexts,
  createdAt: new Date("2024-01-15"),
  lastUpdatedAt: new Date(),
};
// Dummy data

export async function fetchAgent(): Promise<Agent> {
  // API call here
  // return await apiRequest<Agent>("/agent");

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ...mockAgent };
  // Dummy data
}

export async function createContext(
  agentId: string,
  contextData: CreateContextRequest
): Promise<AgentContext> {
  // API call here
  // return await apiRequest<AgentContext>(`/agent/${agentId}/contexts`, {
  //   method: "POST",
  //   body: contextData,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 800));
  const newContext: AgentContext = {
    id: `context-${Date.now()}`,
    ...contextData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return newContext;
  // Dummy data
}

export async function updateContext(
  agentId: string,
  contextId: string,
  updates: UpdateContextRequest
): Promise<AgentContext> {
  // API call here
  // return await apiRequest<AgentContext>(`/agent/${agentId}/contexts/${contextId}`, {
  //   method: "PATCH",
  //   body: updates,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 800));
  const updatedContext: AgentContext = {
    id: contextId,
    name: updates.name || "Updated Context",
    goalId: updates.goalId || "goal-1",
    messageType: updates.messageType || "motivation",
    messageFrequency: updates.messageFrequency || "daily",
    customInstructions: updates.customInstructions,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return updatedContext;
  // Dummy data
}

export async function deleteContext(
  agentId: string,
  contextId: string
): Promise<void> {
  // API call here
  // await apiRequest(`/agent/${agentId}/contexts/${contextId}`, {
  //   method: "DELETE",
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Dummy data
}

export async function deployAgent(agentId: string): Promise<Agent> {
  // API call here
  // return await apiRequest<Agent>(`/agent/${agentId}/deploy`, {
  //   method: "POST",
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    ...mockAgent,
    isDeployed: true,
    deployedAt: new Date(),
    lastUpdatedAt: new Date(),
  };
  // Dummy data
}

export async function stopAgent(agentId: string): Promise<Agent> {
  // API call here
  // return await apiRequest<Agent>(`/agent/${agentId}/stop`, {
  //   method: "POST",
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    ...mockAgent,
    isDeployed: false,
    deployedAt: undefined,
    lastUpdatedAt: new Date(),
  };
  // Dummy data
}

export async function updateAgentCommunication(
  agentId: string,
  channel: CommunicationChannel
): Promise<Agent> {
  // API call here
  // return await apiRequest<Agent>(`/agent/${agentId}/communication`, {
  //   method: "PATCH",
  //   body: { channel },
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    ...mockAgent,
    communicationChannel: channel,
    lastUpdatedAt: new Date(),
  };
  // Dummy data
}
