/** DigestBuilderContainer - Main container for digest builder page */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Digest, DigestFrequency, DeliveryTime, DigestContentType } from "@/types/digest";
import { ApiError } from "@/lib/api";
import {
  fetchDigest,
  createDigest,
  updateDigest,
  toggleDigestStatus,
} from "@/services/digestService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DigestOverview from "./DigestOverview";
import DigestSettings from "./DigestSettings";
import ContentTypesSelector from "./ContentTypesSelector";
import DigestStatusPanel from "./DigestStatusPanel";
import styles from "./digest-builder.module.css";

export default function DigestBuilderContainer() {
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadDigest();
    }
  }, [authLoading]);

  useEffect(() => {
    if (notConfigured) {
      handleCreate();
    }
  }, [notConfigured]);

  const loadDigest = async () => {
    try {
      setLoading(true);
      setNotConfigured(false);
      setError(null);
      const data = await fetchDigest();
      setDigest(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotConfigured(true);
      } else {
        setError("Failed to load digest settings");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      const created = await createDigest({
        name: "My Growth Digest",
        description: "Personalized insights to help me achieve my goals",
        frequency: "daily",
        deliveryTime: "morning",
        contentTypes: ["affirmations", "tips", "motivational_quotes"],
      });
      setDigest(created);
      setNotConfigured(false);
    } catch (err) {
      setError("Failed to create digest");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleFrequencyChange = async (frequency: DigestFrequency) => {
    if (!digest) return;
    try {
      const updated = await updateDigest({
        name: digest.name,
        description: digest.description,
        frequency,
        deliveryTime: digest.deliveryTime,
        contentTypes: digest.contentTypes,
      });
      setDigest(updated);
    } catch (err) {
      console.error("Failed to update frequency:", err);
    }
  };

  const handleDeliveryTimeChange = async (deliveryTime: DeliveryTime) => {
    if (!digest) return;
    try {
      const updated = await updateDigest({
        name: digest.name,
        description: digest.description,
        frequency: digest.frequency,
        deliveryTime,
        contentTypes: digest.contentTypes,
      });
      setDigest(updated);
    } catch (err) {
      console.error("Failed to update delivery time:", err);
    }
  };

  const handleToggleContentType = async (type: DigestContentType) => {
    if (!digest) return;
    const newTypes = digest.contentTypes.includes(type)
      ? digest.contentTypes.filter((t) => t !== type)
      : [...digest.contentTypes, type];
    try {
      const updated = await updateDigest({
        name: digest.name,
        description: digest.description,
        frequency: digest.frequency,
        deliveryTime: digest.deliveryTime,
        contentTypes: newTypes,
      });
      setDigest(updated);
    } catch (err) {
      console.error("Failed to update content types:", err);
    }
  };

  const handleToggleStatus = async () => {
    if (!digest) return;
    try {
      const updated = await toggleDigestStatus();
      setDigest(updated);
    } catch (err) {
      console.error("Failed to toggle digest status:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.agentBuilderContainer}>
        <LoadingSpinner message="Loading digest..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.agentBuilderContainer}>
        <div className={styles.agentBuilderContent}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  if (notConfigured || creating) {
    return (
      <div className={styles.agentBuilderContainer}>
        <LoadingSpinner message="Setting up your digest..." />
      </div>
    );
  }

  return (
    <div className={styles.agentBuilderContainer}>
      <div className={styles.agentBuilderContent}>
        <DigestOverview digest={digest!} />

        <DigestSettings
          frequency={digest!.frequency}
          deliveryTime={digest!.deliveryTime}
          onFrequencyChange={handleFrequencyChange}
          onDeliveryTimeChange={handleDeliveryTimeChange}
        />

        <ContentTypesSelector
          selectedTypes={digest!.contentTypes}
          onToggleType={handleToggleContentType}
        />

        <DigestStatusPanel digest={digest!} onToggleStatus={handleToggleStatus} />
      </div>
    </div>
  );
}
