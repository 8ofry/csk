// Confirm the login + contact endpoints honor their rate-limit budget.
//
// IMPORTANT: rate-limit state is per-process and persists across runs in the
// same dev server. We use unique IPs per spec via the X-Forwarded-For header
// to keep cohabitation safe.

import { expect, test } from "@playwright/test";

test.describe("public POST endpoint rate limits", () => {
  test("login returns 429 after 5 attempts in a minute (per IP)", async ({ request }) => {
    const ip = "203.0.113.91"; // unique per test
    let any429 = false;
    for (let i = 0; i < 8; i++) {
      const res = await request.post("/api/v1/auth/login", {
        data: {
          identifier: "doesnotexist@csk.local",
          password: "Csk!2026wrong",
        },
        headers: { "x-forwarded-for": ip },
      });
      if (res.status() === 429) {
        any429 = true;
        const body = await res.json();
        expect(body.retryAfterSeconds).toBeGreaterThan(0);
        expect(res.headers()["retry-after"]).toBeDefined();
        break;
      }
    }
    expect(any429).toBe(true);
  });

  test("contact form returns 429 after exceeding the hourly bucket (per IP)", async ({
    request,
  }) => {
    const ip = "203.0.113.92";
    let any429 = false;
    for (let i = 0; i < 8; i++) {
      const res = await request.post("/api/v1/public/contact", {
        data: {
          name: `e2e bot ${i}`,
          email: `bot${i}@example.com`,
          message: "automated rate-limit probe",
        },
        headers: { "x-forwarded-for": ip },
      });
      if (res.status() === 429) {
        any429 = true;
        break;
      }
    }
    expect(any429).toBe(true);
  });
});
