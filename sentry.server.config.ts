// Sentry initialization for the server runtime (Node).
// No-op when SENTRY_DSN is not set so dev stays quiet.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Filter out noise: HMR, expected 4xx, etc.
    beforeSend(event) {
      if (event.request?.url?.includes("/_next/")) return null;
      return event;
    },
  });
}
