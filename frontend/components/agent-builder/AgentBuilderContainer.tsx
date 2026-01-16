/**
 * AgentBuilderContainer Component
 *
 * Main container for the Agent Builder page with agent and context management.
 *
 * Component Hierarchy:
 * - AgentBuilderContainer (this component)
 *   ├── AgentBuilderHeader
 *   ├── AgentOverview
 *   ├── CommunicationSettings
 *   ├── ContextList
 *   │   └── ContextCard (for each context)
 *   ├── EmptyContextState (when no contexts)
 *   ├── DeploymentPanel
 *   ├── CreateContextModal
 *   └── EditContextModal
 *
 * Responsibilities:
 * - Fetch and manage agent data
 * - Handle context CRUD operations
 * - Manage deployment state
 * - Handle communication channel selection
 * - Coordinate between child components
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Agent, AgentContext, CreateContextRequest, CommunicationChannel } from "@/types/agent";
import {
  fetchAgent,
  createContext,
  updateContext,
  deleteContext,
  deployAgent,
  stopAgent,
  updateAgentCommunication,
} from "@/services/agentService";
import { fetchGoals } from "@/services/goalService";
import { fetchUserProfile } from "@/services/profileService";
import { Goal } from "@/types/goal";
import { UserProfile } from "@/types/user";
import AgentBuilderHeader from "./AgentBuilderHeader";
import AgentOverview from "./AgentOverview";
import CommunicationSettings from "./CommunicationSettings";
import ContextList from "./ContextList";
import EmptyContextState from "./EmptyContextState";
import DeploymentPanel from "./DeploymentPanel";
import CreateContextModal from "./CreateContextModal";
import EditContextModal from "./EditContextModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import styles from "@/styles/agent/agent-builder.module.css";

export default function AgentBuilderContainer() {
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [agent, setAgent] = useState<Agent | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<AgentContext | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedAgent, fetchedGoals, fetchedProfile] = await Promise.all([
        fetchAgent(),
        fetchGoals(),
        fetchUserProfile(),
      ]);
      setAgent(fetchedAgent);
      setGoals(fetchedGoals);
      setUserProfile(fetchedProfile);
    } catch (error) {
      console.error("Failed to load agent data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContext = async (contextData: CreateContextRequest) => {
    if (!agent) return;

    try {
      const newContext = await createContext(agent.id, contextData);
      const goalName = goals.find((g) => g.id === contextData.goalId)?.title;

      setAgent((prev) =>
        prev
          ? {
              ...prev,
              contexts: [...prev.contexts, { ...newContext, goalName }],
              lastUpdatedAt: new Date(),
            }
          : prev
      );
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create context:", error);
    }
  };

  const handleEditContext = (context: AgentContext) => {
    setSelectedContext(context);
    setIsEditModalOpen(true);
  };

  const handleUpdateContext = async (contextId: string, updates: CreateContextRequest) => {
    if (!agent) return;

    try {
      const updatedContext = await updateContext(agent.id, contextId, updates);
      const goalName = goals.find((g) => g.id === updates.goalId)?.title;

      setAgent((prev) =>
        prev
          ? {
              ...prev,
              contexts: prev.contexts.map((c) =>
                c.id === contextId ? { ...updatedContext, goalName } : c
              ),
              lastUpdatedAt: new Date(),
            }
          : prev
      );
      setIsEditModalOpen(false);
      setSelectedContext(null);
    } catch (error) {
      console.error("Failed to update context:", error);
    }
  };

  const handleDeleteContext = async (contextId: string) => {
    if (!agent || !confirm("Are you sure you want to delete this context?")) return;

    try {
      await deleteContext(agent.id, contextId);
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              contexts: prev.contexts.filter((c) => c.id !== contextId),
              lastUpdatedAt: new Date(),
            }
          : prev
      );
    } catch (error) {
      console.error("Failed to delete context:", error);
    }
  };

  const handleDeploy = async () => {
    if (!agent) return;

    setIsDeploying(true);
    try {
      const deployedAgent = await deployAgent(agent.id);
      setAgent(deployedAgent);
    } catch (error) {
      console.error("Failed to deploy agent:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleStop = async () => {
    if (!agent || !confirm("Are you sure you want to stop your agent?")) return;

    setIsDeploying(true);
    try {
      const stoppedAgent = await stopAgent(agent.id);
      setAgent(stoppedAgent);
    } catch (error) {
      console.error("Failed to stop agent:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCommunicationChange = async (channel: CommunicationChannel) => {
    if (!agent) return;

    try {
      const updatedAgent = await updateAgentCommunication(agent.id, channel);
      setAgent(updatedAgent);
    } catch (error) {
      console.error("Failed to update communication channel:", error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.agentBuilderContainer}>
        <LoadingSpinner message="Loading agent..." />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className={styles.agentBuilderContainer}>
        <div className={styles.errorMessage}>Failed to load agent data</div>
      </div>
    );
  }

  const canDeploy = agent.contexts.length > 0 && !agent.isDeployed;

  return (
    <div className={styles.agentBuilderContainer}>
      <div className={styles.agentBuilderContent}>
        <AgentBuilderHeader />

        <AgentOverview agent={agent} />

        

        {agent.contexts.length === 0 ? (
          <EmptyContextState
            canCreate={true}
            onCreate={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <ContextList
            contexts={agent.contexts}
            canEdit={true}
            onEdit={handleEditContext}
            onDelete={handleDeleteContext}
            onCreate={() => setIsCreateModalOpen(true)}
          />
        )}

        <CommunicationSettings
          currentChannel={agent.communicationChannel}
          onChannelChange={handleCommunicationChange}
          hasPhoneNumber={!!userProfile?.phoneNumber && userProfile.phoneNumber.trim() !== ""}
        />

        <DeploymentPanel
          isDeployed={agent.isDeployed}
          canDeploy={canDeploy}
          isDeploying={isDeploying}
          deployedAt={agent.deployedAt}
          onDeploy={handleDeploy}
          onStop={handleStop}
        />
      </div>

      <CreateContextModal
        isOpen={isCreateModalOpen}
        goals={goals}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateContext}
      />

      <EditContextModal
        isOpen={isEditModalOpen}
        context={selectedContext}
        goals={goals}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedContext(null);
        }}
        onUpdate={handleUpdateContext}
      />
    </div>
  );
}
