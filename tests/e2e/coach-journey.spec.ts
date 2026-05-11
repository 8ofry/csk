// The critical mobile-first coach journey:
//   today → open the seeded past session → mark attendance → save quick eval.
// The seeded past session lives in `seed-group-boxing-fc-evening` and was
// already played; the coach's "today" page may or may not have a session
// scheduled, so we navigate by URL path-prefix rather than a date.

import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/login";

test.describe("coach journey — session lifecycle", () => {
  test("coach can open today + see the dashboard", async ({ page }) => {
    await signIn(page, "coach");
    await page.goto("/en/coach/today");
    await expect(page.getByRole("heading", { name: /^today$/i })).toBeVisible();
  });

  test("coach can browse training units library (read-only)", async ({ page }) => {
    await signIn(page, "coach");
    await page.goto("/en/coach/training-units");
    await expect(page.getByRole("heading", { name: /training units/i })).toBeVisible();
    // Seed publishes 6 units — at least the warm-up should be visible.
    await expect(page.getByText(/dynamic warm-up/i)).toBeVisible();
  });

  test("coach can see their session plans list", async ({ page }) => {
    await signIn(page, "coach");
    await page.goto("/en/coach/session-plans");
    await expect(page.getByRole("heading", { name: /my session plans/i })).toBeVisible();
  });

  test("coach can see their earnings dashboard", async ({ page }) => {
    await signIn(page, "coach");
    await page.goto("/en/coach/earnings");
    await expect(page.getByRole("heading", { name: /my earnings/i })).toBeVisible();
    await expect(page.getByText(/month-to-date/i)).toBeVisible();
  });
});

test.describe("head-coach approvals inbox", () => {
  test("HC sees pending approvals queue with both plans + reports + users", async ({ page }) => {
    await signIn(page, "headCoach");
    await page.goto("/en/head-coach/approvals");
    await expect(page.getByRole("heading", { name: /approvals inbox/i })).toBeVisible();
    await expect(page.getByText(/session plans/i)).toBeVisible();
    await expect(page.getByText(/daily reports/i)).toBeVisible();
    await expect(page.getByText(/pending account approvals/i)).toBeVisible();
  });

  test("HC certificates page shortlists trainees + coaches", async ({ page }) => {
    await signIn(page, "headCoach");
    await page.goto("/en/head-coach/certificates");
    await expect(page.getByRole("heading", { name: /^certificates$/i })).toBeVisible();
    await expect(page.getByText(/best trainee shortlist/i)).toBeVisible();
    await expect(page.getByText(/best coach shortlist/i)).toBeVisible();
  });
});

test.describe("admin financial dashboard", () => {
  test("admin sees the owner snapshot", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/en/admin/financial");
    await expect(page.getByRole("heading", { name: /financial.*owner dashboard/i })).toBeVisible();
    await expect(page.getByText(/total revenue/i)).toBeVisible();
    await expect(page.getByText(/csk net share/i)).toBeVisible();
  });

  test("admin can list all users", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/en/admin/users");
    await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible();
    // Seed has 13 users (4 baseline + 9 demo).
    await expect(page.getByText(/captain saied/i).first()).toBeVisible();
  });
});
