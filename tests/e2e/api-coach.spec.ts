// Coach mobile API — today, session detail, earnings, attendance round-trip.

import { expect, test } from "@playwright/test";
import { bearer, loginAs } from "./helpers/api-auth";

test.describe("coach /api/v1/coach/*", () => {
  test("/coach/today returns occurrences shape", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const res = await request.get("/api/v1/coach/today", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("date");
    expect(Array.isArray(body.occurrences)).toBe(true);
  });

  test("/coach/today accepts a custom date param", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const res = await request.get("/api/v1/coach/today?date=2026-05-11", {
      headers: bearer(session),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.date).toBe("2026-05-11");
  });

  test("/coach/earnings returns totals for the current month", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const res = await request.get("/api/v1/coach/earnings", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("from");
    expect(body).toHaveProperty("to");
    expect(typeof body.total).toBe("number");
    expect(Array.isArray(body.byStream)).toBe(true);
    expect(Array.isArray(body.transactions)).toBe(true);
  });

  test("/coach/sessions/:id returns 404 for unknown session", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const res = await request.get("/api/v1/coach/sessions/nope-no-real-id", {
      headers: bearer(session),
    });
    expect(res.status()).toBe(404);
  });

  test("/coach/sessions/:id returns the seeded past session for coach Mohamed", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const res = await request.get("/api/v1/coach/sessions/seed-session-past", {
      headers: bearer(session),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.session.id).toBe("seed-session-past");
    expect(body.session.status).toBe("COMPLETED");
  });

  test("attendance + quick-eval round-trip on the seeded past session", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const traineeId = "seed-user-trainee";

    const att = await request.post(
      "/api/v1/coach/sessions/seed-session-past/attendance",
      {
        headers: bearer(session),
        data: { marks: [{ traineeId, status: "PRESENT" }] },
      },
    );
    expect(att.status()).toBe(200);

    const eval_ = await request.post(
      "/api/v1/coach/sessions/seed-session-past/quick-eval",
      {
        headers: bearer(session),
        data: { traineeId, effortScore: 8, notes: "Cleaned-up jab" },
      },
    );
    expect(eval_.status()).toBe(200);
    const body = await eval_.json();
    expect(body.ok).toBe(true);
  });
});
