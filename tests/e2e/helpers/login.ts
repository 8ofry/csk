// Shared sign-in helper used by all role-scoped E2E suites.
// Each seeded account uses the same password (Csk!2026 — see prisma/seed.ts).

import { expect, type Page } from "@playwright/test";

export const SEED_PASSWORD = "Csk!2026";

export const SEED_LOGIN = {
  admin: "captain@csk.local",
  headCoach: "head.coach@csk.local",
  coach: "coach@csk.local",
  trainee: "trainee@csk.local",
  trainee_khaled: "khaled@csk.local",
} as const;

export type SeedRole = keyof typeof SEED_LOGIN;

const POST_LOGIN_PATH: Record<SeedRole, string> = {
  admin: "/en/admin",
  headCoach: "/en/head-coach",
  coach: "/en/coach",
  trainee: "/en/trainee",
  trainee_khaled: "/en/trainee",
};

export async function signIn(page: Page, role: SeedRole) {
  const email = SEED_LOGIN[role];
  await page.goto("/en/login");
  await page.getByLabel("Email or phone").fill(email);
  await page.getByLabel("Password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname.startsWith(POST_LOGIN_PATH[role]), {
    timeout: 15_000,
  });
  await expect(page).toHaveURL(new RegExp(`^.*${POST_LOGIN_PATH[role].replace(/\//g, "\\/")}`));
}
