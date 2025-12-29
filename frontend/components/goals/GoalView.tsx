"use client";

import { useState, useEffect } from "react";
import { GoalWithDetails } from "@/types/goal";

interface GoalViewProps {
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalView({ goalId, isOpen, onClose }: GoalViewProps) {
  const [goal, setGoal] = useState<GoalWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && goalId) {
      setIsLoading(true);
      // TODO: Fetch goal data from service
      setIsLoading(false);
    }
  }, [isOpen, goalId]);

  if (!isOpen || !goal) {
    return null;
  }

  return (
    <div>
      <h1>{goal.title}</h1>
      <h2>{goal.description}</h2>
      {goal.specific && <div>Specific: {goal.specific}</div>}
      {goal.measurable && <div>Measurable: {goal.measurable}</div>}
      {goal.attainable && <div>Attainable: {goal.attainable}</div>}
      {goal.relevant && <div>Relevant: {goal.relevant}</div>}
      {goal.timely && <div>Timely: {goal.timely}</div>}
      <div>Created at: {goal.createdAt}</div>
    </div>
  );
}