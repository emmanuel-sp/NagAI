/** DigestBuilderContainer - Main container for digest builder page */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Digest, DigestFrequency, DeliveryTime, DigestContentType } from "@/types/digest";
import {
  fetchDigest,
  updateDigest,
  toggleDigestStatus,
} from "@/services/digestService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DigestHeader from "./DigestHeader";
import DigestOverview from "./DigestOverview";
import DigestSettings from "./DigestSettings";
import ContentTypesSelector from "./ContentTypesSelector";
import DigestStatusPanel from "./DigestStatusPanel";
import styles from "@/styles/digests/digest-builder.module.css";

export default function DigestBuilderContainer() {
  const { loading: authLoading } = useAuth({ requireAuth: true });
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadDigest();
    }
  }, [authLoading]);

  const loadDigest = async () => {
    try {
      setLoading(true);
      const data = await fetchDigest();
      setDigest(data);
      setError(null);
    } catch (err) {
      setError("Failed to load digest");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyChange = async (frequency: DigestFrequency) => {
    if (!digest) return;

    try {
      const updated = await updateDigest(digest.id, {
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
      const updated = await updateDigest(digest.id, {
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

    const currentTypes = digest.contentTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    try {
      const updated = await updateDigest(digest.id, {
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
      const updated = await toggleDigestStatus(digest.id);
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

  if (error || !digest) {
    return (
      <div className={styles.agentBuilderContainer}>
        <div className={styles.agentBuilderContent}>
          <p className={styles.errorMessage}>{error || "Digest not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.agentBuilderContainer}>
      <div className={styles.agentBuilderContent}>
        <DigestHeader />

        <DigestOverview digest={digest} />

        <DigestSettings
          frequency={digest.frequency}
          deliveryTime={digest.deliveryTime}
          onFrequencyChange={handleFrequencyChange}
          onDeliveryTimeChange={handleDeliveryTimeChange}
        />

        <ContentTypesSelector
          selectedTypes={digest.contentTypes}
          onToggleType={handleToggleContentType}
        />

        <DigestStatusPanel digest={digest} onToggleStatus={handleToggleStatus} />
      </div>
    </div>
  );
}
