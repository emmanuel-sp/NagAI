/**
 * Signup Page
 *
 * Main page for the Signup module. This page only imports and renders the SignupContainer component.
 * All business logic and state management is handled in the container component.
 *
 * Component Hierarchy:
 * - SignupPage (this page)
 *   └── SignupContainer
 *       ├── SignupForm
 *       └── SignupLinks
 */

import SignupContainer from "@/components/auth/SignupContainer";

export default function SignupPage() {
  return <SignupContainer />;
}
