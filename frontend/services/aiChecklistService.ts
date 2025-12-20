// AI Checklist Generation Service
// Handles AI-powered checklist item and full checklist generation

import { ChecklistItem } from "@/types/checklist";
import { getGoalById } from "@/lib/mockData";

/**
 * Generate a single checklist item using AI based on goal context
 */
export async function generateChecklistItem(
  goalId: string,
  existingItems: ChecklistItem[]
): Promise<ChecklistItem> {
  // TODO: Replace with actual AI API call to backend
  // Simulating AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const goal = getGoalById(goalId);
  if (!goal) {
    throw new Error("Goal not found");
  }

  // Stub: Generate contextual checklist items based on goal
  const aiGeneratedItems: Record<string, string[]> = {
    "goal-1": [
      "Practice generics with real-world examples",
      "Build a type-safe API wrapper",
      "Contribute to a TypeScript open source project",
      "Create advanced type utilities",
      "Write TypeScript blog posts",
    ],
    "goal-2": [
      "Schedule morning stretching routine",
      "Plan weekly workout sessions",
      "Track protein intake daily",
      "Try a new fitness class",
      "Set monthly fitness milestones",
    ],
    "goal-3": [
      "Review existing documentation for gaps",
      "Create tutorial videos",
      "Add code examples to docs",
      "Get peer review on documentation",
      "Publish documentation to team wiki",
    ],
    "goal-4": [
      "Choose color palette and typography",
      "Add contact form",
      "Optimize images for web",
      "Write compelling project descriptions",
      "Deploy to production",
    ],
  };

  const suggestions = aiGeneratedItems[goalId] || [
    "Complete the next milestone",
    "Review and refine approach",
    "Seek feedback from peers",
    "Document progress and learnings",
  ];

  // Filter out items that might be duplicates
  const existingTitles = existingItems.map((item) =>
    item.title.toLowerCase()
  );
  const availableSuggestions = suggestions.filter(
    (title) => !existingTitles.includes(title.toLowerCase())
  );

  const randomSuggestion =
    availableSuggestions[
      Math.floor(Math.random() * availableSuggestions.length)
    ] || "Complete next task";

  return {
    id: `ai-item-${Date.now()}`,
    title: randomSuggestion,
    notes: "✨ AI-generated suggestion",
    completed: false,
    createdAt: new Date(),
    order: existingItems.length,
  };
}

/**
 * Generate a complete checklist using AI based on goal
 */
export async function generateFullChecklist(
  goalId: string
): Promise<ChecklistItem[]> {
  // TODO: Replace with actual AI API call to backend
  // Simulating AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const goal = getGoalById(goalId);
  if (!goal) {
    throw new Error("Goal not found");
  }

  // Stub: Generate comprehensive checklists based on goal type
  const aiGeneratedChecklists: Record<string, ChecklistItem[]> = {
    "goal-1": [
      {
        id: `ai-${Date.now()}-1`,
        title: "Set up TypeScript development environment",
        notes: "Install TS, configure tsconfig.json, set up linting",
        completed: false,
        createdAt: new Date(),
        order: 0,
      },
      {
        id: `ai-${Date.now()}-2`,
        title: "Master basic types and interfaces",
        notes: "Learn primitives, objects, arrays, tuples",
        completed: false,
        createdAt: new Date(),
        order: 1,
      },
      {
        id: `ai-${Date.now()}-3`,
        title: "Deep dive into generics",
        notes: "Understand generic functions, classes, and constraints",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        completed: false,
        createdAt: new Date(),
        order: 2,
      },
      {
        id: `ai-${Date.now()}-4`,
        title: "Learn utility types and advanced patterns",
        notes: "Pick, Omit, Partial, Record, mapped types, conditional types",
        completed: false,
        createdAt: new Date(),
        order: 3,
      },
      {
        id: `ai-${Date.now()}-5`,
        title: "Build a real-world TypeScript project",
        notes: "Apply knowledge to create something practical",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
        completed: false,
        createdAt: new Date(),
        order: 4,
      },
    ],
    "goal-2": [
      {
        id: `ai-${Date.now()}-1`,
        title: "Create a weekly workout schedule",
        notes: "Plan 3-4 days of strength training, 2 days cardio",
        completed: false,
        createdAt: new Date(),
        order: 0,
      },
      {
        id: `ai-${Date.now()}-2`,
        title: "Set up nutrition tracking",
        notes: "Download app, calculate macros, plan meals",
        completed: false,
        createdAt: new Date(),
        order: 1,
      },
      {
        id: `ai-${Date.now()}-3`,
        title: "Establish morning and evening routines",
        notes: "Stretching, hydration, sleep schedule",
        completed: false,
        createdAt: new Date(),
        order: 2,
      },
      {
        id: `ai-${Date.now()}-4`,
        title: "Track progress with measurements",
        notes: "Weekly weigh-ins, photos, performance metrics",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        completed: false,
        createdAt: new Date(),
        order: 3,
      },
      {
        id: `ai-${Date.now()}-5`,
        title: "Find an accountability partner",
        notes: "Join fitness community or workout with a friend",
        completed: false,
        createdAt: new Date(),
        order: 4,
      },
    ],
  };

  const checklist =
    aiGeneratedChecklists[goalId] ||
    generateDefaultChecklist(goal.title, goal.description);

  return checklist;
}

function generateDefaultChecklist(
  goalTitle: string,
  goalDescription: string
): ChecklistItem[] {
  return [
    {
      id: `ai-${Date.now()}-1`,
      title: `Research best practices for: ${goalTitle}`,
      notes: "✨ AI-generated",
      completed: false,
      createdAt: new Date(),
      order: 0,
    },
    {
      id: `ai-${Date.now()}-2`,
      title: "Break down goal into smaller milestones",
      notes: "✨ AI-generated",
      completed: false,
      createdAt: new Date(),
      order: 1,
    },
    {
      id: `ai-${Date.now()}-3`,
      title: "Create action plan with deadlines",
      notes: "✨ AI-generated",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      completed: false,
      createdAt: new Date(),
      order: 2,
    },
    {
      id: `ai-${Date.now()}-4`,
      title: "Start working on first milestone",
      notes: "✨ AI-generated",
      completed: false,
      createdAt: new Date(),
      order: 3,
    },
    {
      id: `ai-${Date.now()}-5`,
      title: "Review progress and adjust plan",
      notes: "✨ AI-generated",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      completed: false,
      createdAt: new Date(),
      order: 4,
    },
  ];
}
