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
import AgentOverview from "./AgentOverview";
import CommunicationSettings from "./CommunicationSettings";
import ContextList from "./ContextList";
import EmptyContextState from "./EmptyContextState";
import DeploymentPanel from "./DeploymentPanel";
import CreateContextModal from "./CreateContextModal";
import EditContextModal from "./EditContextModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import styles from "./agent-builder.module.css";

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
      const newContext = await createContext(contextData);
      setAgent((prev) =>
        prev ? { ...prev, contexts: [...prev.contexts, newContext] } : prev
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

  const handleUpdateContext = async (contextId: number, updates: CreateContextRequest) => {
    if (!agent) return;

    try {
      const updatedContext = await updateContext(contextId, updates);
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              contexts: prev.contexts.map((c) =>
                c.contextId === contextId ? updatedContext : c
              ),
            }
          : prev
      );
      setIsEditModalOpen(false);
      setSelectedContext(null);
    } catch (error) {
      console.error("Failed to update context:", error);
    }
  };

  const handleDeleteContext = async (contextId: number) => {
    if (!agent || !confirm("Are you sure you want to delete this context?")) return;

    try {
      await deleteContext(contextId);
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              contexts: prev.contexts.filter((c) => c.contextId !== contextId),
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
      const deployedAgent = await deployAgent();
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
      const stoppedAgent = await stopAgent();
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
      const updatedAgent = await updateAgentCommunication(channel);
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

  const canDeploy = agent.contexts.length > 0 && !agent.deployed;

  return (
    <div className={styles.agentBuilderContainer}>
      <div className={styles.agentBuilderContent}>
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
          isDeployed={agent.deployed}
          canDeploy={canDeploy}
          isDeploying={isDeploying}
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
