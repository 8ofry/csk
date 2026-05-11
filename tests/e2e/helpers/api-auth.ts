// Mobile-API auth helper for Playwright E2E.

import type { APIRequestContext } from "@playwright/test";

export const SEED_PASSWORD = "Csk!2026";

export const SEED_LOGIN = {
  admin: "captain@csk.local",
  headCoach: "head.coach@csk.local",
  coach: "coach@csk.local",
  trainee: "trainee@csk.local",
  trainee_khaled: "khaled@csk.local",
} as const;

export type SeedRole = keyof typeof SEED_LOGIN;

export interface ApiSession {
  token: string;
  user: {
    id: string;
    role: string;
    email: string;
    fullNameEn: string;
    preferredLocale: string;
  };
}

export async function loginAs(
  request: APIRequestContext,
  role: SeedRole,
): Promise<ApiSession> {
  const res = await request.post("/api/v1/auth/login", {
    data: {
      identifier: SEED_LOGIN[role],
      password: SEED_PASSWORD,
      deviceLabel: `e2e:${role}`,
    },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${role}: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export function bearer(session: ApiSession): { Authorization: string } {
  return { Authorization: `Bearer ${session.token}` };
}
