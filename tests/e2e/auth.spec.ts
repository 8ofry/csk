// Login flow for each seeded role lands on the right dashboard.
// FR-AUTH-05.

import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/login";

test.describe("authentication", () => {
  test("rejects unknown credentials", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email or phone").fill("nope@csk.local");
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 5_000 });
  });

  test("admin lands on admin dashboard", async ({ page }) => {
    await signIn(page, "admin");
    await expect(page.getByRole("heading", { name: /system admin dashboard/i })).toBeVisible();
  });

  test("head coach lands on HC dashboard", async ({ page }) => {
    await signIn(page, "headCoach");
    await expect(page.getByRole("heading", { name: /head coach dashboard/i })).toBeVisible();
  });

  test("coach lands on coach dashboard", async ({ page }) => {
    await signIn(page, "coach");
    await expect(page.getByRole("heading", { name: /coach dashboard/i })).toBeVisible();
  });

  test("trainee lands on trainee dashboard", async ({ page }) => {
    await signIn(page, "trainee");
    await expect(page.getByRole("heading", { name: /my dashboard/i })).toBeVisible();
  });
});
