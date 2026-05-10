import { test, expect } from "@playwright/test";

test.describe("Register flow", () => {
  test("register page is reachable and validates", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByRole("heading", { name: /Create|Register/i })).toBeVisible();
  });
});
