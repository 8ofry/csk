"use client";

// Global app error boundary. Captures unhandled render errors and reports to
// Sentry when the DSN is set.

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
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#0A0A0A",
          color: "#F5F5F5",
          padding: 32,
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 640, margin: "60px auto" }}>
          <h1 style={{ color: "#D4AF37", fontSize: 28 }}>Something went wrong</h1>
          <p style={{ marginTop: 12, color: "#D4D4D4" }}>
            We&apos;ve logged the error and the team will look into it. You can try again or
            return to the dashboard.
          </p>
          {error.digest && (
            <p style={{ marginTop: 16, fontSize: 12, color: "#666" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: "#D4AF37",
                color: "#0A0A0A",
                border: "none",
                padding: "10px 20px",
                fontWeight: 600,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                border: "1px solid #D4AF37",
                color: "#D4AF37",
                padding: "10px 20px",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
