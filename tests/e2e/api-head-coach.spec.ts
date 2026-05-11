// Head Coach mobile API — approvals queue + decision shape.

import { expect, test } from "@playwright/test";
import { bearer, loginAs } from "./helpers/api-auth";

test.describe("/api/v1/head-coach/*", () => {
  test("/approvals returns the combined queue with counts", async ({ request }) => {
    const session = await loginAs(request, "headCoach");
    const res = await request.get("/api/v1/head-coach/approvals", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("sessionPlans");
    expect(body).toHaveProperty("dailyReports");
    expect(body).toHaveProperty("pendingUsers");
    expect(body.counts).toMatchObject({
      sessionPlans: expect.any(Number),
      dailyReports: expect.any(Number),
      overdueDailyReports: expect.any(Number),
      pendingUsers: expect.any(Number),
    });
  });

  test("session-plan decision rejects empty body", async ({ request }) => {
    const session = await loginAs(request, "headCoach");
    const res = await request.post(
      "/api/v1/head-coach/session-plans/seed-plan-1/decision",
      {
        headers: bearer(session),
        data: {},
      },
    );
    expect(res.status()).toBe(400);
  });

  test("session-plan decision: reject without comment is rejected", async ({ request }) => {
    const session = await loginAs(request, "headCoach");
    const res = await request.post(
      "/api/v1/head-coach/session-plans/seed-plan-1/decision",
      {
        headers: bearer(session),
        data: { decision: "reject" },
      },
    );
    expect(res.status()).toBe(400);
  });

  test("daily-report decision: reject with too-short comment is rejected", async ({ request }) => {
    const session = await loginAs(request, "headCoach");
    const res = await request.post(
      "/api/v1/head-coach/daily-reports/seed-daily-report-x/decision",
      {
        headers: bearer(session),
        data: { decision: "reject", comment: "no" },
      },
    );
    expect(res.status()).toBe(400);
  });

  test("daily-report decision requires HEAD_COACH role", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const res = await request.post(
      "/api/v1/head-coach/daily-reports/seed-daily-report-x/decision",
      {
        headers: bearer(session),
        data: { decision: "approve" },
      },
    );
    expect(res.status()).toBe(403);
  });
});
