"use client";

import { useState, useEffect } from "react";
import { Goal } from "@/types/chat";
import { fetchGoals } from "@/services/goalService";
import { sendMessage } from "@/services/chatService";
import styles from "@/styles/support.module.css";

type ResponseType = "reflection" | "guidance" | "encouragement" | "motivation";

interface AgentResponse {
  id: string;
  type: ResponseType;
  content: string;
  timestamp: Date;
  goalContext?: string[];
}

export default function SupportPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<ResponseType | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseHistory, setResponseHistory] = useState<AgentResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const fetchedGoals = await fetchGoals();
      setGoals(
        fetchedGoals.map((g) => ({ id: g.id, name: g.title || g.description }))
      );
    } catch (error) {
      console.error("Failed to load goals:", error);
    }
  };

  const handleResponseTypeClick = async (type: ResponseType) => {
    setSelectedType(type);
    setIsLoading(true);
    setCurrentResponse("");

    try {
      // Create a prompt based on the response type
      const prompts: Record<ResponseType, string> = {
        reflection: "Provide a thoughtful reflection on my current goals and progress.",
        guidance: "Give me practical guidance on how to achieve my goals.",
        encouragement: "Share some encouraging words to help me stay motivated.",
        motivation: "Give me a motivational message to boost my energy and focus.",
      };

      const response = await sendMessage(
        prompts[type],
        "support-session",
        selectedGoals.length > 0 ? selectedGoals : undefined
      );

      setCurrentResponse(response.content);

      // Add to history
      const newResponse: AgentResponse = {
        id: `response-${Date.now()}`,
        type,
        content: response.content,
        timestamp: new Date(),
        goalContext: selectedGoals.length > 0 ? selectedGoals : undefined,
      };
      setResponseHistory((prev) => [newResponse, ...prev]);
    } catch (error) {
      console.error("Failed to get response:", error);
      setCurrentResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const responseTypeButtons: Array<{
    type: ResponseType;
    label: string;
    icon: string;
  }> = [
    { type: "reflection", label: "Reflection", icon: "🤔" },
    { type: "guidance", label: "Guidance", icon: "🧭" },
    { type: "encouragement", label: "Encouragement", icon: "💪" },
    { type: "motivation", label: "Motivation", icon: "🔥" },
  ];

  return (
    <div className={styles.supportContainer}>
      <div className={styles.supportContent}>
        {/* Header */}
        <header className={styles.supportHeader}>
          <h1 className={styles.supportTitle}>Support</h1>
          <p className={styles.supportSubtitle}>
            Get personalized support from your AI agent
          </p>
        </header>

        {/* Goal Selector */}
        {goals.length > 0 && (
          <section className={styles.goalSection}>
            <h3 className={styles.sectionLabel}>Select Goals (Optional)</h3>
            <div className={styles.goalChips}>
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoalSelection(goal.id)}
                  className={`${styles.goalChip} ${
                    selectedGoals.includes(goal.id)
                      ? styles.goalChipSelected
                      : ""
                  }`}
                >
                  {selectedGoals.includes(goal.id) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                  {goal.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Response Type Buttons */}
        <section className={styles.responseTypeSection}>
          <h3 className={styles.sectionLabel}>What do you need?</h3>
          <div className={styles.responseTypeButtons}>
            {responseTypeButtons.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => handleResponseTypeClick(type)}
                disabled={isLoading}
                className={`${styles.responseTypeButton} ${
                  selectedType === type ? styles.responseTypeButtonActive : ""
                }`}
              >
                <span className={styles.buttonIcon}>{icon}</span>
                <span className={styles.buttonLabel}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Response Display */}
        {(currentResponse || isLoading) && (
          <section className={styles.responseSection}>
            <div className={styles.responseCard}>
              {isLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Getting your {selectedType}...</p>
                </div>
              ) : (
                <>
                  <div className={styles.responseHeader}>
                    <span className={styles.responseType}>
                      {responseTypeButtons.find((b) => b.type === selectedType)
                        ?.icon}{" "}
                      {selectedType &&
                        selectedType.charAt(0).toUpperCase() +
                          selectedType.slice(1)}
                    </span>
                    <span className={styles.responseTime}>
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className={styles.responseContent}>{currentResponse}</div>
                </>
              )}
            </div>
          </section>
        )}

        {/* History Button */}
        {responseHistory.length > 0 && (
          <section className={styles.historySection}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={styles.historyToggle}
            >
              {showHistory ? "Hide" : "Show"} History ({responseHistory.length})
            </button>

            {showHistory && (
              <div className={styles.historyList}>
                {responseHistory.map((response) => (
                  <div key={response.id} className={styles.historyItem}>
                    <div className={styles.historyItemHeader}>
                      <span className={styles.historyItemType}>
                        {
                          responseTypeButtons.find(
                            (b) => b.type === response.type
                          )?.icon
                        }{" "}
                        {response.type.charAt(0).toUpperCase() +
                          response.type.slice(1)}
                      </span>
                      <span className={styles.historyItemTime}>
                        {response.timestamp.toLocaleDateString()} at{" "}
                        {response.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className={styles.historyItemContent}>
                      {response.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
