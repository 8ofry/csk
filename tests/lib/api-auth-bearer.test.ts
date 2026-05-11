// We can't unit-test full requireApiUser without a DB, but the bearer
// extraction logic is observable through the unauthenticated path.

import { describe, expect, it, vi } from "vitest";

// Mock the API token service so authenticate() returns a deterministic result.
vi.mock("@/application/api-tokens/service", () => ({
  hashToken: (s: string) => s,
  verifyToken: vi.fn(async (raw: string) => (raw === "valid-token" ? { userId: "u1", tokenId: "t1", touched: true } : null)),
}));

vi.mock("@/infrastructure/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === "u1"
          ? {
              id: "u1",
              role: "COACH",
              email: "u1@x",
              fullNameEn: "User One",
              fullNameAr: "أحد",
              preferredLocale: "EN",
              status: "ACTIVE",
            }
          : null,
      ),
    },
  },
}));

import { authenticate, requireApiRole, requireApiUser } from "@/lib/api-auth";

function req(headers: Record<string, string>) {
  return new Request("http://x/", { headers });
}

describe("api-auth bearer + role guard", () => {
  it("authenticate returns null with no Authorization header", async () => {
    expect(await authenticate(req({}))).toBeNull();
  });

  it("authenticate returns null for non-Bearer Authorization", async () => {
    expect(await authenticate(req({ authorization: "Basic abc" }))).toBeNull();
  });

  it("authenticate returns null for unknown bearer token", async () => {
    expect(await authenticate(req({ authorization: "Bearer not-a-real-token" }))).toBeNull();
  });

  it("authenticate returns the user for valid bearer token", async () => {
    const user = await authenticate(req({ authorization: "Bearer valid-token" }));
    expect(user?.id).toBe("u1");
    expect(user?.role).toBe("COACH");
  });

  it("requireApiUser returns response when missing token", async () => {
    const result = await requireApiUser(req({}));
    expect("response" in result).toBe(true);
    if ("response" in result) expect(result.response.status).toBe(401);
  });

  it("requireApiRole denies role below minimum", async () => {
    const result = await requireApiRole(req({ authorization: "Bearer valid-token" }), "ADMIN");
    expect("response" in result).toBe(true);
    if ("response" in result) expect(result.response.status).toBe(403);
  });

  it("requireApiRole allows role at or above minimum", async () => {
    const result = await requireApiRole(req({ authorization: "Bearer valid-token" }), "COACH");
    expect("user" in result).toBe(true);
  });

  it("Bearer token is case-insensitive on the scheme", async () => {
    const user = await authenticate(req({ authorization: "bearer valid-token" }));
    expect(user?.id).toBe("u1");
  });
});
