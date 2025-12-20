/**
 * Goals Page
 *
 * Main page for the Goals module. This page only imports and renders the GoalsContainer component.
 * All business logic and state management is handled in the container component.
 *
 * Component Hierarchy:
 * - GoalsPage (this page)
 *   └── GoalsContainer
 *       ├── GoalsHeader
 *       ├── GoalsEmptyState (when no goals)
 *       ├── GoalsList (when goals exist)
 *       ├── AddGoalModal
 *       └── EditGoalModal
 */

import GoalsContainer from "@/components/goals/GoalsContainer";

export default function GoalsPage() {
  return <GoalsContainer />;
}
