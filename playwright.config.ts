import { defineConfig, devices } from "@playwright/test";

// Playwright E2E config (NFR-MNT-04 / NFR-PERF-01).
// Smoke suite assumes a running database with the demo seed loaded —
// see README "End-to-end tests" section.

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // shared seed data — keep tests serial to avoid races
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "en",
    timezoneId: "Africa/Cairo",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: `next dev --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_DEFAULT_LOCALE: "en",
          E2E_TESTING: "true",
        },
      },
});
