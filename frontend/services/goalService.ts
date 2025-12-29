import { Goal, GoalWithDetails } from "@/types/goal";

// Dummy data
const MOCK_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "Learn TypeScript",
    description: "Master TypeScript fundamentals and advanced patterns",
    createdAt: "Jan 15, 2024",
    targetDate: "Mar 15, 2024",
  },
  {
    id: "goal-2",
    title: "Build a SaaS Product",
    description: "Launch a profitable software as a service application",
    createdAt: "Jan 20, 2024",
    targetDate: "Jun 30, 2024",
  },
  {
    id: "goal-3",
    title: "Get Fit",
    description: "Achieve target weight and maintain healthy lifestyle",
    createdAt: "Jan 10, 2024",
    targetDate: "Apr 10, 2024",
  },
];
// Dummy data

export async function fetchGoals(): Promise<Goal[]> {
  // API call here
  // return await apiRequest<Goal[]>("/goals");

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...MOCK_GOALS];
  // Dummy data
}

export async function fetchGoalById(id: string): Promise<GoalWithDetails | null> {
  // API call here
  // return await apiRequest<GoalWithDetails>(`/goals/${id}`);

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 200));
  const goal = MOCK_GOALS.find(g => g.id === id);
  if (!goal) {
    return null;
  }
  return {
    ...goal,
    specific: "Break down into specific, measurable components",
    measurable: "Track progress with weekly milestones",
    attainable: "Allocate 10 hours per week for this goal",
    relevant: "Critical for career growth and project success",
    timely: `Complete by ${goal.targetDate}`,
  };
  // Dummy data
}

export async function updateGoal(id: string, data: Partial<GoalWithDetails>): Promise<GoalWithDetails | null> {
  // API call here
  // return await apiRequest<GoalWithDetails>(`/goals/${id}`, {
  //   method: "PATCH",
  //   body: data,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 400));
  const existingGoal = await fetchGoalById(id);
  if (!existingGoal) {
    return null;
  }
  return {
    ...existingGoal,
    ...data,
  };
  // Dummy data
}

export async function createGoal(data: Omit<GoalWithDetails, "id" | "createdAt">): Promise<GoalWithDetails> {
  // API call here
  // return await apiRequest<GoalWithDetails>("/goals", {
  //   method: "POST",
  //   body: data,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    ...data,
    id: `goal-${Date.now()}`,
    createdAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
  // Dummy data
}

export async function deleteGoal(_id: string): Promise<boolean> {
  // API call here
  // await apiRequest(`/goals/${id}`, { method: "DELETE" });
  // return true;

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 300));
  return true;
  // Dummy data
}
