// Public marketing pages render without crashing and contain key brand content.
// FR-WEB-01..05.

import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("landing page shows the hero and CTA", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("CSK", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /join csk/i })).toBeVisible();
  });

  test("locations page lists CSK venues", async ({ page }) => {
    await page.goto("/en/locations");
    await expect(page.getByRole("heading", { name: /our locations/i })).toBeVisible();
    await expect(page.getByText("Fight Club", { exact: false }).first()).toBeVisible();
  });

  test("disciplines page renders all 5 disciplines", async ({ page }) => {
    await page.goto("/en/disciplines");
    await expect(page.getByRole("heading", { name: /^disciplines$/i })).toBeVisible();
    for (const name of ["Boxing", "Kickboxing", "MMA", "Karate", "Fitness"]) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
    }
  });

  test("schedule page renders weekly recurring sessions", async ({ page }) => {
    await page.goto("/en/schedule");
    await expect(page.getByRole("heading", { name: /^schedule$/i })).toBeVisible();
  });

  test("coaches page renders the coaching roster", async ({ page }) => {
    await page.goto("/en/coaches");
    await expect(page.getByRole("heading", { name: /our coaches/i })).toBeVisible();
  });

  test("pricing page surfaces the plan", async ({ page }) => {
    await page.goto("/en/pricing");
    await expect(page.getByRole("heading", { name: /plans & pricing/i })).toBeVisible();
    await expect(page.getByText(/12 sessions/i)).toBeVisible();
  });

  test("merchandise public catalog renders items from seed", async ({ page }) => {
    await page.goto("/en/merchandise");
    await expect(page.getByRole("heading", { name: /csk merchandise/i })).toBeVisible();
  });

  test("contact form is reachable + has a submit button", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(page.getByRole("heading", { name: /contact csk/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
  });

  test("Arabic landing renders with RTL direction", async ({ page }) => {
    await page.goto("/ar");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ar");
    await expect(html).toHaveAttribute("dir", "rtl");
  });
});
