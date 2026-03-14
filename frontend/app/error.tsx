"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "12px",
        padding: "24px",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-manrope)",
          fontWeight: 700,
          fontSize: "20px",
          color: "var(--text-primary)",
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "14px",
          lineHeight: 1.6,
          maxWidth: "360px",
          textAlign: "center",
        }}
      >
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        style={{
          background: "var(--accent)",
          color: "var(--text-inverse)",
          padding: "10px 24px",
          borderRadius: "var(--radius-md)",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "14px",
          marginTop: "8px",
        }}
      >
        Try again
      </button>
    </div>
  );
}
