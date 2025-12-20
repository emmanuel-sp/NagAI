// Centralized mock data for development
// This ensures consistency across all modules

import { GoalDetails } from "@/components/goals/Goal";
import { Checklist, ChecklistItem } from "@/types/checklist";
import { ChatSession } from "@/types/chat";

// ============================================
// GOALS MOCK DATA
// ============================================

export const MOCK_GOALS: GoalDetails[] = [
  {
    id: "goal-1",
    title: "Learn TypeScript Advanced Patterns",
    description:
      "Deep dive into generic types, decorators, and advanced TypeScript features",
    createdAt: "Nov 5, 2024",
    targetDate: "Feb 15, 2025",
  },
  {
    id: "goal-2",
    title: "Get Fit and Healthy",
    description:
      "Maintain consistent workout schedule with focus on strength training and nutrition",
    createdAt: "Oct 1, 2024",
    targetDate: "Dec 31, 2025",
  },
  {
    id: "goal-3",
    title: "Complete Project Documentation",
    description:
      "Write comprehensive documentation for the new feature rollout",
    createdAt: "Nov 10, 2024",
    targetDate: "Jan 30, 2025",
  },
  {
    id: "goal-4",
    title: "Build Personal Portfolio",
    description:
      "Create a professional portfolio website showcasing projects and skills",
    createdAt: "Dec 1, 2024",
    targetDate: "Mar 1, 2025",
  },
];

// ============================================
// CHECKLIST ITEMS MOCK DATA
// ============================================

const CHECKLIST_ITEMS: Record<string, ChecklistItem[]> = {
  "goal-1": [
    {
      id: "item-1",
      title: "Read TypeScript handbook",
      notes: "Focus on advanced types and generics",
      completed: true,
      createdAt: new Date("2024-11-15"),
      completedAt: new Date("2024-11-20"),
      order: 0,
    },
    {
      id: "item-2",
      title: "Build a TypeScript project",
      notes: "Create a CLI tool with TypeScript",
      deadline: new Date("2025-02-15"),
      completed: false,
      createdAt: new Date("2024-11-16"),
      order: 1,
    },
    {
      id: "item-3",
      title: "Learn type guards and type narrowing",
      completed: false,
      createdAt: new Date("2024-11-17"),
      order: 2,
    },
    {
      id: "item-4",
      title: "Master utility types",
      notes: "Pick, Omit, Partial, Required, etc.",
      completed: false,
      createdAt: new Date("2024-11-18"),
      order: 3,
    },
  ],
  "goal-2": [
    {
      id: "item-5",
      title: "Go to gym 3x per week",
      notes: "Monday, Wednesday, Friday - strength training",
      completed: true,
      createdAt: new Date("2024-10-10"),
      completedAt: new Date("2024-12-01"),
      order: 0,
    },
    {
      id: "item-6",
      title: "Hit 10k steps daily",
      deadline: new Date("2025-03-01"),
      completed: false,
      createdAt: new Date("2024-10-10"),
      order: 1,
    },
    {
      id: "item-7",
      title: "Meal prep every Sunday",
      notes: "Focus on high protein, balanced meals",
      completed: false,
      createdAt: new Date("2024-10-12"),
      order: 2,
    },
    {
      id: "item-8",
      title: "Track calories and macros",
      completed: true,
      createdAt: new Date("2024-10-15"),
      completedAt: new Date("2024-11-01"),
      order: 3,
    },
  ],
  "goal-3": [
    {
      id: "item-9",
      title: "Create documentation outline",
      completed: true,
      createdAt: new Date("2024-11-12"),
      completedAt: new Date("2024-11-14"),
      order: 0,
    },
    {
      id: "item-10",
      title: "Write API documentation",
      notes: "Include all endpoints with examples",
      deadline: new Date("2025-01-15"),
      completed: false,
      createdAt: new Date("2024-11-15"),
      order: 1,
    },
    {
      id: "item-11",
      title: "Create user guide",
      notes: "Step-by-step tutorials with screenshots",
      completed: false,
      createdAt: new Date("2024-11-16"),
      order: 2,
    },
  ],
  "goal-4": [
    {
      id: "item-12",
      title: "Design portfolio layout",
      notes: "Use Figma for mockups",
      completed: false,
      createdAt: new Date("2024-12-02"),
      order: 0,
    },
    {
      id: "item-13",
      title: "Set up Next.js project",
      completed: false,
      createdAt: new Date("2024-12-03"),
      order: 1,
    },
    {
      id: "item-14",
      title: "Write project case studies",
      notes: "3-4 major projects with details",
      deadline: new Date("2025-02-15"),
      completed: false,
      createdAt: new Date("2024-12-04"),
      order: 2,
    },
  ],
};

// ============================================
// CHECKLISTS MOCK DATA
// ============================================

export const MOCK_CHECKLISTS: Checklist[] = MOCK_GOALS.map((goal) => ({
  id: `checklist-${goal.id}`,
  goalId: goal.id,
  goalTitle: goal.title,
  items: CHECKLIST_ITEMS[goal.id] || [],
  createdAt: new Date(goal.createdAt),
  updatedAt: new Date(),
}));

// ============================================
// CHAT SESSIONS MOCK DATA
// ============================================

export const MOCK_CHAT_SESSIONS: ChatSession[] = [
  { id: "session-1", date: "2024-12-19", label: "Today's Chat" },
  { id: "session-2", date: "2024-12-18", label: "Yesterday's Chat" },
  { id: "session-3", date: "2024-12-15", label: "Project Planning" },
  { id: "session-4", date: "2024-12-10", label: "Goal Review" },
];

// ============================================
// AI RESPONSES
// ============================================

export const AI_RESPONSE_TEMPLATES = {
  reflection: [
    "Looking at your progress, you've made significant strides toward {goalTitle}. The consistency you've shown is impressive. What patterns do you notice in your most productive moments?",
    "Your journey with {goalTitle} shows both challenges and victories. Taking time to reflect: what has been your biggest learning so far?",
    "I notice you've been working on {goalTitle}. How do you feel about your progress? Sometimes acknowledging how far we've come helps us see the path forward more clearly.",
  ],
  guidance: [
    "To move forward with {goalTitle}, I'd suggest breaking it into smaller milestones. Start with what you can accomplish this week.",
    "Based on your checklist for {goalTitle}, prioritizing the items with deadlines first would help maintain momentum. What's the next actionable step you can take today?",
    "For {goalTitle}, consider the 2-minute rule: if something takes less than 2 minutes, do it immediately. This builds momentum for larger tasks.",
  ],
  encouragement: [
    "You're doing great work on {goalTitle}! Progress isn't always linear, but you're moving in the right direction. Keep going!",
    "I see you've completed several items for {goalTitle}. That's fantastic! Each small win builds toward your larger goal. You've got this!",
    "Working on {goalTitle} takes dedication, and you're showing up. That consistency will compound over time. Stay committed!",
  ],
  motivation: [
    "Remember why you started {goalTitle}. That vision is still within reach. Let's make today count!",
    "You've already proven you can do this by the progress you've made on {goalTitle}. Push through - you're closer than you think!",
    "Every expert was once a beginner. Your work on {goalTitle} is building skills that will serve you for years. Keep pushing!",
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getGoalById(id: string): GoalDetails | null {
  return MOCK_GOALS.find((goal) => goal.id === id) || null;
}

export function getChecklistByGoalId(goalId: string): Checklist | null {
  return MOCK_CHECKLISTS.find((checklist) => checklist.goalId === goalId) || null;
}

export function getRandomAIResponse(
  type: keyof typeof AI_RESPONSE_TEMPLATES,
  goalId?: string
): string {
  const templates = AI_RESPONSE_TEMPLATES[type];
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

  if (goalId) {
    const goal = getGoalById(goalId);
    return randomTemplate.replace("{goalTitle}", goal?.title || "your goal");
  }

  return randomTemplate.replace("{goalTitle}", "your goals");
}
