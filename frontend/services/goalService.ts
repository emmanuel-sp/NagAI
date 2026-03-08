import { apiRequest } from "@/lib/api";
import { Goal, GoalWithDetails } from "@/types/goal";

export async function fetchGoals(): Promise<Goal[]> {
  return apiRequest<Goal[]>("/goals");
}

export async function fetchGoalById(goalId: number): Promise<GoalWithDetails> {
  return apiRequest<GoalWithDetails>(`/goals/${goalId}`);
}

export async function createGoal(data: Omit<GoalWithDetails, "goalId" | "createdAt">): Promise<GoalWithDetails> {
  return apiRequest<GoalWithDetails>("/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateGoal(_id: number, data: Partial<GoalWithDetails>): Promise<GoalWithDetails> {
  return apiRequest<GoalWithDetails>("/goals", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteGoal(id: number): Promise<void> {
  return apiRequest<void>(`/goals/${id}`, { method: "DELETE" });
}
