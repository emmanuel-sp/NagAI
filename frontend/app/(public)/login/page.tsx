/**
 * Login Page
 *
 * Main page for the Login module. This page only imports and renders the LoginContainer component.
 * All business logic and state management is handled in the container component.
 *
 * Component Hierarchy:
 * - LoginPage (this page)
 *   └── LoginContainer
 *       ├── LoginForm
 *       └── LoginLinks
 */

import LoginContainer from "@/components/auth/LoginContainer";

export default function LoginPage() {
  return <LoginContainer />;
}
