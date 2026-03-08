"use client";

import { useState } from "react";
import { generateSmartGoalSuggestion } from "@/services/aiGoalService";

export type SmartField = "specific" | "measurable" | "attainable" | "relevant" | "timely";

export interface SmartGoalFields {
  title: string;
  description: string;
  targetDate: string;
  specific: string;
  measurable: string;
  attainable: string;
  relevant: string;
  timely: string;
}

const emptyFields: SmartGoalFields = {
  title: "",
  description: "",
  targetDate: "",
  specific: "",
  measurable: "",
  attainable: "",
  relevant: "",
  timely: "",
};

export function useSmartGoalForm(initialValues?: Partial<SmartGoalFields>) {
  const [fields, setFields] = useState<SmartGoalFields>({ ...emptyFields, ...initialValues });
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const setField = (field: keyof SmartGoalFields, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const resetFields = (values?: Partial<SmartGoalFields>) => {
    setFields({ ...emptyFields, ...values });
    setSuggestions({});
    setSuggestionError(null);
  };

  const generateSuggestion = async (field: SmartField) => {
    if (!fields.title.trim()) {
      alert("Please enter a goal title first to generate AI suggestions");
      return;
    }

    setSuggestionError(null);
    setLoadingSuggestion(field);

    const smartFieldKeys: SmartField[] = ["specific", "measurable", "attainable", "relevant", "timely"];
    const existingFields = Object.fromEntries(
      smartFieldKeys
        .filter((f) => f !== field && fields[f].trim())
        .map((f) => [f, fields[f]])
    ) as Partial<Record<SmartField, string>>;

    try {
      const suggestion = await generateSmartGoalSuggestion(
        field, fields.title, fields.description,
        Object.keys(existingFields).length > 0 ? existingFields : undefined
      );
      setSuggestions((prev) => ({ ...prev, [field]: suggestion }));
    } catch (error) {
      console.error("Failed to generate suggestion:", error);
      setSuggestionError("AI suggestion unavailable. Please try again.");
    } finally {
      setLoadingSuggestion(null);
    }
  };

  const useSuggestion = (field: SmartField) => {
    const suggestion = suggestions[field];
    if (suggestion) {
      setField(field, suggestion);
      setSuggestions((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return {
    fields,
    setField,
    resetFields,
    loadingSuggestion,
    suggestions,
    suggestionError,
    generateSuggestion,
    useSuggestion,
  };
}
