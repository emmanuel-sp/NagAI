"use client";

import { useCallback, useState } from "react";
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
  stepsTaken: string;
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
  stepsTaken: "",
};

export function useSmartGoalForm(initialValues?: Partial<SmartGoalFields>) {
  const [fields, setFields] = useState<SmartGoalFields>({ ...emptyFields, ...initialValues });
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const setField = useCallback((field: keyof SmartGoalFields, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetFields = useCallback((values?: Partial<SmartGoalFields>) => {
    setFields({ ...emptyFields, ...values });
    setSuggestions({});
    setSuggestionError(null);
  }, []);

  const generateSuggestion = useCallback(async (field: SmartField) => {
    if (!fields.title.trim()) {
      setSuggestionError("Please enter a goal title first to generate AI suggestions");
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
        Object.keys(existingFields).length > 0 ? existingFields : undefined,
        fields.stepsTaken.trim() || undefined,
        fields.targetDate.trim() || undefined
      );
      setSuggestions((prev) => ({ ...prev, [field]: suggestion }));
    } catch (error) {
      console.error("Failed to generate suggestion:", error);
      setSuggestionError("AI suggestion unavailable. Please try again.");
    } finally {
      setLoadingSuggestion(null);
    }
  }, [fields]);

  const applySuggestion = useCallback((field: SmartField) => {
    const suggestion = suggestions[field];
    if (suggestion) {
      setField(field, suggestion);
      setSuggestions((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [setField, suggestions]);

  return {
    fields,
    setField,
    resetFields,
    loadingSuggestion,
    suggestions,
    suggestionError,
    generateSuggestion,
    applySuggestion,
  };
}
