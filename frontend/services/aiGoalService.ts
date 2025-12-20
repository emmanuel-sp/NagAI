// AI Goal Generation Service
// Handles AI-powered SMART goal suggestions

/**
 * Generate AI suggestion for a SMART goal field
 */
export async function generateSmartGoalSuggestion(
  field: "specific" | "measurable" | "attainable" | "relevant" | "timely",
  goalTitle: string,
  goalDescription: string
): Promise<string> {
  // TODO: Replace with actual AI API call to backend
  // Simulating AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const suggestions: Record<
    string,
    Record<string, string>
  > = {
    specific: {
      default: "Define the exact outcome you want to achieve with clear, concrete details",
      "learn typescript": "Master TypeScript fundamentals including types, interfaces, generics, and advanced patterns",
      "get fit": "Achieve a healthy body composition through consistent exercise and balanced nutrition",
      "build portfolio": "Create a professional portfolio website showcasing 5-7 diverse projects with detailed case studies",
      "write book": "Complete a 50,000-word manuscript on [topic] with 12 chapters and supporting research",
    },
    measurable: {
      default: "Establish clear metrics to track your progress and know when you've succeeded",
      "learn typescript": "Complete 3 TypeScript projects and score 90% or higher on TypeScript certification exam",
      "get fit": "Reduce body fat by 5%, increase strength by 20%, and exercise 4 times per week",
      "build portfolio": "Publish portfolio with 100% Lighthouse score, 6 projects, and receive 10+ pieces of feedback",
      "write book": "Write 500 words daily, complete 1 chapter per week, and reach 50,000 total words",
    },
    attainable: {
      default: "Break down the goal into achievable steps within your current resources and constraints",
      "learn typescript": "Dedicate 1 hour daily to TypeScript study, leverage free online resources, and build practice projects",
      "get fit": "Start with 30-minute workouts 3x/week, gradually increase intensity, and meal prep on Sundays",
      "build portfolio": "Allocate 10 hours/week, use existing skills, and leverage free hosting and tools",
      "write book": "Write during morning hours when energy is high, outline chapters in advance, and set mini-deadlines",
    },
    relevant: {
      default: "Align this goal with your broader life objectives and personal values",
      "learn typescript": "Critical for advancing career in web development and building type-safe, maintainable applications",
      "get fit": "Essential for long-term health, energy, and ability to enjoy life activities fully",
      "build portfolio": "Key to landing dream job, showcasing skills to clients, and building professional credibility",
      "write book": "Fulfills creative passion, establishes authority in field, and creates lasting impact",
    },
    timely: {
      default: "Set a realistic deadline that creates urgency without causing burnout",
      "learn typescript": "Achieve proficiency within 3 months, with weekly milestones and monthly assessments",
      "get fit": "Reach target metrics within 6 months, with bi-weekly progress checks and adjustments",
      "build portfolio": "Launch complete portfolio in 2 months, with weekly completion of individual projects",
      "write book": "Complete first draft in 6 months, second draft in 3 months, and publish within 1 year",
    },
  };

  // Find matching suggestion based on goal title keywords
  const titleLower = goalTitle.toLowerCase();
  const descLower = goalDescription.toLowerCase();
  const fieldSuggestions = suggestions[field];

  for (const [keyword, suggestion] of Object.entries(fieldSuggestions)) {
    if (
      keyword !== "default" &&
      (titleLower.includes(keyword) || descLower.includes(keyword))
    ) {
      return suggestion;
    }
  }

  return fieldSuggestions.default;
}
