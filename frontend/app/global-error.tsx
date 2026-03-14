"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body
        style={{
          background: "#ffffff",
          color: "#50514F",
          fontFamily: "Inter, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "24px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#8e8f8d", fontSize: "14px", marginBottom: "24px", lineHeight: 1.6 }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#9e605a",
              color: "#f5eee6",
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
