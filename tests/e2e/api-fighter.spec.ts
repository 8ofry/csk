// Public fighter profile — verifies the seeded Khaled fighter shape and that
// the response contains no PII fields.

import { expect, test } from "@playwright/test";

const PII_FIELDS = ["email", "phone", "nationalId", "homeAddress", "dob", "passwordHash"];

test.describe("/api/v1/public/fighter/:id", () => {
  test("returns sanitized profile for the seeded fighter Khaled", async ({ request }) => {
    const res = await request.get("/api/v1/public/fighter/seed-user-trainee-khaled");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.fighter.id).toBe("seed-user-trainee-khaled");
    expect(body.fighter.fullNameEn).toBe("Trainee Khaled");
    expect(body.fighter.record.display).toBe("1-0-0");
    expect(body.fighter.fights.length).toBeGreaterThanOrEqual(1);
    expect(body.fighter.championships.length).toBeGreaterThanOrEqual(1);
  });

  test("returns 404 for an unknown id", async ({ request }) => {
    const res = await request.get("/api/v1/public/fighter/totally-bogus-id");
    expect(res.status()).toBe(404);
  });

  test("returns 404 for a non-trainee user (admin id)", async ({ request }) => {
    const res = await request.get("/api/v1/public/fighter/seed-user-admin");
    expect(res.status()).toBe(404);
  });

  test("response contains zero PII fields", async ({ request }) => {
    const res = await request.get("/api/v1/public/fighter/seed-user-trainee-khaled");
    expect(res.status()).toBe(200);
    const text = await res.text();
    for (const field of PII_FIELDS) {
      expect(text).not.toContain(`"${field}"`);
    }
  });

  test("page renders with hero + record badge", async ({ page }) => {
    await page.goto("/en/champions/seed-user-trainee-khaled");
    await expect(page.getByRole("heading", { name: /trainee khaled/i })).toBeVisible();
    await expect(page.getByText("1-0-0")).toBeVisible();
  });

  test("champions list links to individual profiles", async ({ page }) => {
    await page.goto("/en/champions");
    const link = page.getByRole("link").filter({ hasText: /trainee khaled/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByRole("heading", { name: /trainee khaled/i })).toBeVisible();
  });
});
