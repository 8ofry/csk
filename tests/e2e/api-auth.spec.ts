// Mobile API auth surface — login, /me, role guards, logout.

import { expect, test } from "@playwright/test";
import { bearer, loginAs, SEED_LOGIN, SEED_PASSWORD } from "./helpers/api-auth";

test.describe("/api/v1 auth", () => {
  test("discovery index lists every section", async ({ request }) => {
    const res = await request.get("/api/v1/public");
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const key of ["public", "auth", "trainee", "coach", "headCoach"]) {
      expect(body).toHaveProperty(key);
    }
  });

  test("login + /me round-trip for the seeded coach", async ({ request }) => {
    const session = await loginAs(request, "coach");
    expect(session.token.length).toBeGreaterThan(20);
    expect(session.user.role).toBe("COACH");
    expect(session.user.email).toBe(SEED_LOGIN.coach);

    const me = await request.get("/api/v1/me", { headers: bearer(session) });
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.user.id).toBe(session.user.id);
  });

  test("login rejects bad password without leaking which field is wrong", async ({ request }) => {
    const res = await request.post("/api/v1/auth/login", {
      data: { identifier: SEED_LOGIN.trainee, password: "WrongPassword123!" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.toLowerCase()).toContain("invalid credentials");
  });

  test("login rejects unknown identifier with the same generic error", async ({ request }) => {
    const res = await request.post("/api/v1/auth/login", {
      data: { identifier: "nope@csk.local", password: SEED_PASSWORD },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error.toLowerCase()).toContain("invalid credentials");
  });

  test("/me without bearer returns 401", async ({ request }) => {
    const res = await request.get("/api/v1/me");
    expect(res.status()).toBe(401);
  });

  test("/me with malformed bearer returns 401", async ({ request }) => {
    const res = await request.get("/api/v1/me", {
      headers: { Authorization: "Bearer not-a-real-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    });
    expect(res.status()).toBe(401);
  });

  test("logout revokes the token (subsequent /me returns 401)", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const logout = await request.post("/api/v1/auth/logout", { headers: bearer(session) });
    expect(logout.status()).toBe(200);

    const me = await request.get("/api/v1/me", { headers: bearer(session) });
    expect(me.status()).toBe(401);
  });
});

test.describe("role guards", () => {
  test("trainee cannot access /api/v1/coach/today", async ({ request }) => {
    const session = await loginAs(request, "trainee");
    const res = await request.get("/api/v1/coach/today", { headers: bearer(session) });
    expect(res.status()).toBe(403);
  });

  test("coach cannot access /api/v1/head-coach/approvals", async ({ request }) => {
    const session = await loginAs(request, "coach");
    const res = await request.get("/api/v1/head-coach/approvals", { headers: bearer(session) });
    expect(res.status()).toBe(403);
  });

  test("admin (above HEAD_COACH) can access /api/v1/head-coach/approvals", async ({ request }) => {
    const session = await loginAs(request, "admin");
    const res = await request.get("/api/v1/head-coach/approvals", { headers: bearer(session) });
    expect(res.status()).toBe(200);
  });
});
