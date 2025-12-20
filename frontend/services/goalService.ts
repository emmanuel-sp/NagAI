// Goal service stub - will be connected to backend API

import { GoalDetails } from "@/components/goals/Goal";
import { MOCK_GOALS, getGoalById } from "@/lib/mockData";

export interface GoalDetailsFull extends GoalDetails {
  specific?: string;
  measurable?: string;
  attainable?: string;
  relevant?: string;
  timely?: string;
}

/**
 * Fetch all goals for the current user
 */
export async function fetchGoals(): Promise<GoalDetails[]> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Stub: Return mock goals
  return [...MOCK_GOALS];
}

/**
 * Fetch a specific goal by ID with full SMART details
 */
export async function fetchGoalById(
  id: string
): Promise<GoalDetailsFull | null> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Stub: Find goal and add SMART details
  const goal = getGoalById(id);
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
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  id: string,
  data: Partial<GoalDetailsFull>
): Promise<GoalDetailsFull | null> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Stub: Return updated goal
  const existingGoal = await fetchGoalById(id);
  if (!existingGoal) {
    return null;
  }

  return {
    ...existingGoal,
    ...data,
  };
}

/**
 * Create a new goal
 */
export async function createGoal(
  data: Omit<GoalDetailsFull, "id" | "createdAt">
): Promise<GoalDetailsFull> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Stub: Return newly created goal with generated ID
  const newGoal: GoalDetailsFull = {
    ...data,
    id: `goal-${Date.now()}`,
    createdAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };

  return newGoal;
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: string): Promise<boolean> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Stub: Return success
  return true;
}
