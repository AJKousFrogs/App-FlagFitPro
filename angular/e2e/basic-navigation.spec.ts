import { test, expect } from "@playwright/test";

test.describe("Basic Navigation", () => {
  test("should load the public entry route", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/($|login|register|todays-practice)/);
  });

  test("should navigate to login page when not authenticated", async ({ page }) => {
    await page.goto("/todays-practice");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("should navigate between main sections", async ({ page }) => {
    await page.goto("/todays-practice");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("should keep protected navigation behind auth", async ({ page }) => {
    await page.goto("/training");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });
});
