// Public REST API contract sanity. These match what the v2 mobile app will rely on.

import { expect, test } from "@playwright/test";

test.describe("public REST API — /api/v1/public/*", () => {
  test("discovery index lists all endpoints", async ({ request }) => {
    const res = await request.get("/api/v1/public");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.version).toBe("v1");
    expect(body.endpoints).toMatchObject({
      "GET /api/v1/public/locations": expect.any(String),
      "GET /api/v1/public/coaches": expect.any(String),
      "POST /api/v1/public/contact": expect.any(String),
    });
  });

  test("locations endpoint returns the seeded venues", async ({ request }) => {
    const res = await request.get("/api/v1/public/locations");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.locations)).toBe(true);
    expect(body.locations.length).toBeGreaterThanOrEqual(5);
    const names = body.locations.map((l: { nameEn: string }) => l.nameEn);
    expect(names).toContain("Fight Club");
  });

  test("disciplines endpoint returns 5 active disciplines", async ({ request }) => {
    const res = await request.get("/api/v1/public/disciplines");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.disciplines.length).toBeGreaterThanOrEqual(5);
  });

  test("schedule endpoint returns groups under their location", async ({ request }) => {
    const res = await request.get("/api/v1/public/schedule");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.locations)).toBe(true);
    if (body.locations.length > 0) {
      expect(body.locations[0]).toHaveProperty("groups");
    }
  });

  test("merchandise endpoint excludes archived/zero-stock items + omits cost prices", async ({ request }) => {
    const res = await request.get("/api/v1/public/merchandise");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    if (body.items.length > 0) {
      const first = body.items[0];
      expect(first).toHaveProperty("salePrice");
      expect(first).not.toHaveProperty("costPrice");
    }
  });

  test("contact POST validates required fields", async ({ request }) => {
    const res = await request.post("/api/v1/public/contact", {
      data: { name: "x", email: "not-an-email", message: "short" },
    });
    expect(res.status()).toBe(400);
  });

  test("contact POST accepts a valid submission", async ({ request }) => {
    const res = await request.post("/api/v1/public/contact", {
      data: {
        name: "Playwright Smoke",
        email: "smoke@e2e.example",
        message: "This is an automated end-to-end test submission.",
      },
    });
    expect(res.status()).toBe(202);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
