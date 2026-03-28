"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAgentData } from "@/contexts/AgentDataContext";
import { AgentMessageDetail, ChatMessage, ChatSession } from "@/types/chat";
import {
  sendMessage,
  fetchSessions,
  fetchSessionMessages,
  deleteSession,
  fetchAgentMessage,
  fetchContextSummary,
} from "@/services/chatService";
import SessionDropdown from "./SessionDropdown";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import PresetPrompts from "./PresetPrompts";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import styles from "./chat.module.css";

export default function ChatContainer() {
  const { user, loading: authLoading } = useAuth({ requireAuth: true });
  const searchParams = useSearchParams();
  const { agent, goals } = useAgentData();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Selected context / goal for chat
  const [selectedContextId, setSelectedContextId] = useState<number | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const contextSummaryCache = useRef<Map<number, string>>(new Map());

  // fromContext: stored from email link, attached to first message only
  const fromContextRef = useRef<string>("");

  // Specific agent message loaded from email link (?msg=ID)
  const [linkedAgentMessage, setLinkedAgentMessage] = useState<AgentMessageDetail | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user]);

  // Handle fromContext + msg query params (email-to-chat link)
  useEffect(() => {
    if (!user) return;
    const fromContext = searchParams.get("fromContext");
    if (!fromContext) return;
    const contextId = parseInt(fromContext, 10);
    if (isNaN(contextId)) return;

    setSelectedContextId(contextId);

    const msgParam = searchParams.get("msg");
    const msgId = msgParam ? parseInt(msgParam, 10) : NaN;

    if (!isNaN(msgId)) {
      // Specific message: fetch it, show as first message, use as focused context
      fetchAgentMessage(msgId)
        .then((detail) => {
          if (detail) {
            setLinkedAgentMessage(detail);
            const summary =
              `The user clicked "Continue in Chat" on this specific agent email:\n` +
              `Context: ${detail.contextName}\n` +
              `Subject: ${detail.subject}\n` +
              `---\n${detail.content}`;
            fromContextRef.current = summary;
            contextSummaryCache.current.set(contextId, summary);
          }
        })
        .catch(() => {});
    } else {
      // Fallback: no specific message, load general context summary
      fetchContextSummary(contextId)
        .then((summary) => {
          if (summary) {
            fromContextRef.current = summary;
            contextSummaryCache.current.set(contextId, summary);
          }
        })
        .catch(() => {});
    }
  }, [user, searchParams]);

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch {
      // silently fail
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    loadMessages(activeSessionId);
  }, [activeSessionId]);

  const loadMessages = async (sessionId: number) => {
    try {
      const data = await fetchSessionMessages(sessionId);
      setMessages(data);
    } catch {
      setMessages([]);
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Fetch and cache context summary when selected
  const handleSelectContext = useCallback(async (contextId: number | null) => {
    setSelectedContextId(contextId);
    if (contextId && !contextSummaryCache.current.has(contextId)) {
      try {
        const summary = await fetchContextSummary(contextId);
        contextSummaryCache.current.set(contextId, summary);
      } catch {
        // silently fail
      }
    }
  }, []);

  const handleSelectGoal = useCallback((goalId: number | null) => {
    setSelectedGoalId(goalId);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return;

      // Optimistically add user message
      const tempUserMsg: ChatMessage = {
        messageId: Date.now(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setSending(true);

      try {
        // Attach fromContext on the first message of a new session, then clear it
        let contextSummary = fromContextRef.current || undefined;
        if (contextSummary) fromContextRef.current = "";

        // If a context is selected and no fromContext, attach the cached summary
        if (!contextSummary && selectedContextId) {
          contextSummary = contextSummaryCache.current.get(selectedContextId);
        }

        // If a goal is selected, build a context string from the goal
        if (!contextSummary && selectedGoalId) {
          const goal = goals.find((g) => g.goalId === selectedGoalId);
          if (goal) {
            contextSummary = `The user wants to discuss their goal: "${goal.title}" — ${goal.description}`;
          }
        }

        const response = await sendMessage({
          sessionId: activeSessionId ?? undefined,
          message: text,
          fromContextSummary: contextSummary,
        });

        // If new session, set it as active and add to list
        if (!activeSessionId) {
          setLinkedAgentMessage(null);
          setActiveSessionId(response.sessionId);
          setSessions((prev) => [
            {
              sessionId: response.sessionId,
              title: response.sessionTitle,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }

        // Add assistant message
        const assistantMsg: ChatMessage = {
          messageId: response.messageId,
          role: "assistant",
          content: response.content,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.messageId !== tempUserMsg.messageId)
        );
      } finally {
        setSending(false);
      }
    },
    [activeSessionId, sending, selectedContextId, selectedGoalId, goals]
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setLinkedAgentMessage(null);
    fromContextRef.current = "";
  }, []);

  const handleSelectSession = useCallback((sessionId: number) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleDeleteSession = useCallback(
    async (sessionId: number) => {
      try {
        await deleteSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch {
        // silently fail
      }
    },
    [activeSessionId]
  );

  if (authLoading || loadingSessions) {
    return (
      <div className={styles.loadingPage}>
        <LoadingSpinner />
      </div>
    );
  }

  // Prepend the linked agent message as an assistant message when in a new chat
  const displayMessages: ChatMessage[] = [];
  if (linkedAgentMessage && !activeSessionId) {
    displayMessages.push({
      messageId: -1,
      role: "assistant",
      content: linkedAgentMessage.content,
      createdAt: linkedAgentMessage.sentAt || new Date().toISOString(),
    });
  }
  displayMessages.push(...messages);

  const hasMessages = displayMessages.length > 0;

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const contexts = agent?.contexts ?? [];

  const chatInputProps = {
    onSend: handleSend,
    disabled: sending,
    contexts,
    goals,
    selectedContextId,
    selectedGoalId,
    onSelectContext: handleSelectContext,
    onSelectGoal: handleSelectGoal,
  };

  return (
    <div className={`${styles.chatScroll} ${!hasMessages && !sending ? styles.chatScrollEmpty : ""}`}>
      <div className={`${styles.chatPage} ${!hasMessages && !sending ? styles.chatPageEmpty : ""}`}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <SessionDropdown
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelect={handleSelectSession}
              onDelete={handleDeleteSession}
              onNewChat={handleNewChat}
            />
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.newChatButton} onClick={handleNewChat}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New chat
            </button>
          </div>
        </div>

        {hasMessages || sending ? (
          <>
            <MessageList
              messages={displayMessages}
              sending={sending}
              messagesEndRef={messagesEndRef}
              userInitials={initials}
            />
            <ChatInput {...chatInputProps} />
          </>
        ) : (
          <div className={styles.emptyCentered}>
            <PresetPrompts onSelect={handleSend} />
            <ChatInput {...chatInputProps} centered />
          </div>
        )}
      </div>
    </div>
  );
}
