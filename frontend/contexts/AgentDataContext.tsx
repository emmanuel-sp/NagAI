"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Agent, AgentContext as AgentCtx, CreateContextRequest } from "@/types/agent";
import { Goal } from "@/types/goal";
import {
  fetchAgent,
  createContext as apiCreateContext,
  updateContext as apiUpdateContext,
  deleteContext as apiDeleteContext,
  deployAgent,
  stopAgent,
} from "@/services/agentService";
import { fetchGoals } from "@/services/goalService";

interface AgentDataState {
  agent: Agent | null;
  goals: Goal[];
  loading: boolean;
  handleCreateContext: (data: CreateContextRequest) => Promise<AgentCtx | null>;
  handleUpdateContext: (contextId: number, data: CreateContextRequest) => Promise<AgentCtx | null>;
  handleDeleteContext: (contextId: number) => Promise<boolean>;
  handleDeploy: () => Promise<boolean>;
  handleStop: () => Promise<boolean>;
  refreshAgent: () => Promise<void>;
}

const AgentDataContext = createContext<AgentDataState | null>(null);

export function AgentDataProvider({
  children,
  isLoggedIn,
}: {
  children: ReactNode;
  isLoggedIn: boolean;
}) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [a, g] = await Promise.all([fetchAgent(), fetchGoals()]);
      setAgent(a);
      setGoals(g);
    } catch {
      // silently fail — user may not have agent yet
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateContext = useCallback(
    async (data: CreateContextRequest): Promise<AgentCtx | null> => {
      try {
        const ctx = await apiCreateContext(data);
        setAgent((prev) =>
          prev ? { ...prev, contexts: [...prev.contexts, ctx] } : prev
        );
        return ctx;
      } catch {
        return null;
      }
    },
    []
  );

  const handleUpdateContext = useCallback(
    async (contextId: number, data: CreateContextRequest): Promise<AgentCtx | null> => {
      try {
        const ctx = await apiUpdateContext(contextId, data);
        setAgent((prev) =>
          prev
            ? {
                ...prev,
                contexts: prev.contexts.map((c) =>
                  c.contextId === contextId ? ctx : c
                ),
              }
            : prev
        );
        return ctx;
      } catch {
        return null;
      }
    },
    []
  );

  const handleDeleteContext = useCallback(async (contextId: number): Promise<boolean> => {
    try {
      await apiDeleteContext(contextId);
      setAgent((prev) =>
        prev
          ? { ...prev, contexts: prev.contexts.filter((c) => c.contextId !== contextId) }
          : prev
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleDeploy = useCallback(async (): Promise<boolean> => {
    try {
      const a = await deployAgent();
      setAgent(a);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleStop = useCallback(async (): Promise<boolean> => {
    try {
      const a = await stopAgent();
      setAgent(a);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <AgentDataContext.Provider
      value={{
        agent,
        goals,
        loading,
        handleCreateContext,
        handleUpdateContext,
        handleDeleteContext,
        handleDeploy,
        handleStop,
        refreshAgent: loadData,
      }}
    >
      {children}
    </AgentDataContext.Provider>
  );
}

export function useAgentData() {
  const ctx = useContext(AgentDataContext);
  if (!ctx) throw new Error("useAgentData must be used within AgentDataProvider");
  return ctx;
}
