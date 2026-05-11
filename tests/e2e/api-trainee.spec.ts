// Trainee /me/* endpoints — uses seeded data from prisma/seed.ts.

import { expect, test } from "@playwright/test";
import { bearer, loginAs } from "./helpers/api-auth";

test.describe("trainee /api/v1/me/*", () => {
  test("/me/subscriptions returns the trainee's seeded subscription(s)", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const res = await request.get("/api/v1/me/subscriptions", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.subscriptions)).toBe(true);
    // Seed gives Trainee Ahmed a Boxing subscription at Fight Club, fee 1000.
    expect(body.subscriptions.length).toBeGreaterThanOrEqual(1);
    const first = body.subscriptions[0];
    expect(first).toMatchObject({
      monthlyFee: expect.any(Number),
      sessionsPerMonth: expect.any(Number),
      paymentStatus: expect.any(String),
    });
  });

  test("/me/payments returns an array (possibly empty)", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const res = await request.get("/api/v1/me/payments?limit=10", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.payments)).toBe(true);
  });

  test("/me/schedule returns derived sessions across enrolled groups", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const res = await request.get("/api/v1/me/schedule?weeks=2", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.sessions)).toBe(true);
    if (body.sessions.length > 0) {
      const first = body.sessions[0];
      expect(first).toMatchObject({
        groupId: expect.any(String),
        groupName: expect.any(String),
        location: expect.objectContaining({ nameEn: expect.any(String) }),
      });
    }
  });

  test("/me/evaluations returns the seeded quick evaluation for Ahmed", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const res = await request.get("/api/v1/me/evaluations", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Seed records a quick eval with effortScore=9 and notes "Sharp jab today".
    expect(body.quick.length).toBeGreaterThanOrEqual(1);
    const sharp = body.quick.find((q: { notes?: string }) => q.notes?.toLowerCase().includes("jab"));
    expect(sharp?.effortScore).toBe(9);
  });

  test("/me/championships returns career record (seeded Khaled has 1-0-0)", async ({ request }) => {
    const session = await loginAs(request, "trainee_khaled");
    const res = await request.get("/api/v1/me/championships", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.record.display).toBe("1-0-0");
    expect(body.record.total).toBe(1);
    expect(body.mine.length).toBeGreaterThanOrEqual(1);
  });

  test("/me/medical returns Khaled's clearance status = true", async ({ request }) => {
    const session = await loginAs(request, "trainee_khaled");
    const res = await request.get("/api/v1/me/medical", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.cleared).toBe(true);
    expect(Array.isArray(body.documents)).toBe(true);
    expect(body.documents.length).toBeGreaterThanOrEqual(1);
  });

  test("/me/certificates returns an array", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const res = await request.get("/api/v1/me/certificates", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.certificates)).toBe(true);
  });

  test("/me/reports/monthly returns an array (may be empty until first month rolls)", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const res = await request.get("/api/v1/me/reports/monthly", { headers: bearer(session) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.reports)).toBe(true);
  });
});
