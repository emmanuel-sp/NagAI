/**
 * Agent Builder Page
 *
 * Main page for the Agent Builder module. This page only imports and renders the AgentBuilderContainer component.
 * All business logic and state management is handled in the container component.
 *
 * Component Hierarchy:
 * - AgentBuilderPage (this page)
 *   └── AgentBuilderContainer
 *       ├── AgentBuilderHeader
 *       ├── AgentOverview
 *       ├── CommunicationSettings
 *       ├── ContextList
 *       │   └── ContextCard (for each context)
 *       ├── EmptyContextState (when no contexts)
 *       ├── DeploymentPanel
 *       ├── CreateContextModal
 *       └── EditContextModal
 */

import AgentBuilderContainer from "@/components/agent-builder/AgentBuilderContainer";

export default function AgentBuilderPage() {
  return <AgentBuilderContainer />;
}
