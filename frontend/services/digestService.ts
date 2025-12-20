// Weekly digest service stub - will be connected to backend API

export interface Digest {
  id: string;
  weekOf: string; // ISO date string for the start of the week
  generatedAt: string; // ISO date string
  summary: string;
  accomplishments: string[];
  areasForImprovement: string[];
  upcomingGoals: string[];
  insights: string;
}

/**
 * Fetch all weekly digests for the user
 */
export async function fetchDigests(): Promise<Digest[]> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  // Stub: Return mock digest data
  return [
    {
      id: "digest-1",
      weekOf: "2025-12-15",
      generatedAt: "2025-12-22T10:00:00Z",
      summary:
        "A productive week with strong focus on professional development and consistent exercise habits.",
      accomplishments: [
        "Completed TypeScript documentation project",
        "Maintained daily workout streak",
        "Read 3 chapters of 'Clean Code'",
      ],
      areasForImprovement: [
        "Reduce late-night screen time",
        "Improve morning meditation consistency",
      ],
      upcomingGoals: [
        "Start new feature development",
        "Continue Spanish lessons",
      ],
      insights:
        "Your productivity peaks between 9 AM - 12 PM. Consider scheduling important tasks during this window.",
    },
    {
      id: "digest-2",
      weekOf: "2025-12-08",
      generatedAt: "2025-12-15T10:00:00Z",
      summary:
        "Steady progress on goals with good balance between work and personal development.",
      accomplishments: [
        "Launched new feature successfully",
        "Completed 5 workouts",
        "Started journaling habit",
      ],
      areasForImprovement: [
        "Time management during meetings",
        "Reduce social media usage",
      ],
      upcomingGoals: [
        "Document new feature",
        "Plan Q1 objectives",
      ],
      insights:
        "You're most consistent with goals when you schedule them in the morning.",
    },
  ];
}

/**
 * Fetch a specific digest by ID
 */
export async function fetchDigestById(id: string): Promise<Digest | null> {
  // TODO: Replace with actual API call to backend
  const digests = await fetchDigests();
  return digests.find((d) => d.id === id) || null;
}

/**
 * Generate a new weekly digest
 */
export async function generateDigest(): Promise<Digest> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay (digest generation may take longer)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Stub: Return a newly generated digest
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of current week

  return {
    id: `digest-${Date.now()}`,
    weekOf: weekStart.toISOString().split("T")[0],
    generatedAt: now.toISOString(),
    summary: "Your weekly digest has been generated!",
    accomplishments: [
      "Made progress on active goals",
      "Maintained good productivity habits",
    ],
    areasForImprovement: [
      "Focus on consistency",
      "Review and update goals regularly",
    ],
    upcomingGoals: ["Continue current momentum"],
    insights:
      "Keep up the great work! Consistency is key to achieving your goals.",
  };
}

/**
 * Delete a digest
 */
export async function deleteDigest(id: string): Promise<boolean> {
  // TODO: Replace with actual API call to backend
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Stub: Return success
  return true;
}
