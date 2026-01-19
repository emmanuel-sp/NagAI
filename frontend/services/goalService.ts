import { apiRequest } from "@/lib/api";
import { Goal, GoalWithDetails } from "@/types/goal";

// Dummy data
const MOCK_GOALS: Goal[] = [
  {
    goalId: 1,
    title: "Learn TypeScript",
    description: "Master TypeScript fundamentals and advanced patterns",
    createdAt: "Jan 15, 2024",
    targetDate: "Mar 15, 2024",
  },
  {
    goalId: 2,
    title: "Build a SaaS Product",
    description: "Launch a profitable software as a service application",
    createdAt: "Jan 20, 2024",
    targetDate: "Jun 30, 2024",
  },
  {
    goalId: 3,
    title: "Get Fit",
    description: "Achieve target weight and maintain healthy lifestyle",
    createdAt: "Jan 10, 2024",
    targetDate: "Apr 10, 2024",
  },
];
// Dummy data

export async function fetchGoals(): Promise<Goal[]> {
  return await apiRequest<Goal[]>("/goals");
}

export async function fetchGoalById(goalId: number): Promise<GoalWithDetails | null> {
  return await apiRequest<GoalWithDetails>(`/goals/${goalId}`);
}

export async function updateGoal(id: number, data: Partial<GoalWithDetails>): Promise<GoalWithDetails | null> {
  // API call here
  return await apiRequest<GoalWithDetails>(`/goals`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function createGoal(data: Omit<GoalWithDetails, "goalId" | "createdAt">): Promise<GoalWithDetails> {
  return await apiRequest<GoalWithDetails>(`/goals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  // Dummy data
}

export async function deleteGoal(_id: number): Promise<boolean> {
  return await apiRequest(`/goals/${_id}`, { method: "DELETE" });
  
}
