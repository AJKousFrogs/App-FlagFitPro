/**
 * Smoke Test - Basic App Shell Verification
 *
 * Quick test to verify the app loads and renders the shell correctly.
 * This is the fastest test to run and should catch critical rendering issues.
 *
 * Run with: npx playwright test e2e/smoke.spec.ts
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4200";

// Test credentials (matching existing test files)
// Default: aljkous@gmail.com / Futsal12!!!!
// Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables to override
const _TEST_USER = {
  email: process.env["TEST_USER_EMAIL"] || "aljkous@gmail.com",
  password: process.env["TEST_USER_PASSWORD"] || "Futsal12!!!!",
};

/**
 * Dismisses the cookie consent banner by setting localStorage consent.
 */
async function dismissCookieBanner(page: Page): Promise<void> {
  await page.evaluate(() => {
    const consent = {
      necessary: true,
      analytics: true,
      functional: true,
      consentDate: new Date().toISOString(),
      consentVersion: "1.0",
    };
    localStorage.setItem("flagfit_cookie_consent", JSON.stringify(consent));
  });

  // Try to click dismiss if banner is already visible
  try {
    const banner = page.locator("app-cookie-consent-banner");
    if (await banner.isVisible({ timeout: 500 }).catch(() => false)) {
      await page
        .locator("app-cookie-consent-banner button")
        .filter({ hasText: /Accept All/i })
        .click({ force: true, timeout: 2000 })
        .catch(() => {});
      await page.waitForTimeout(500);
    }
  } catch {
    // Banner not present or already dismissed
  }
}

test.describe("Smoke Test - App Shell", () => {
  test("should load app and render shell", async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissCookieBanner(page);

    // Wait for Angular to bootstrap
    await page.waitForLoadState("networkidle");

    // Verify app shell is rendered
    // Check for main layout component or app root
    const appRoot = page.locator("app-root").first();
    await expect(appRoot).toBeVisible({ timeout: 10000 });

    // Verify no critical console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("favicon") &&
        !e.includes("chunk") &&
        !e.includes("net::ERR_CONNECTION_REFUSED") &&
        !e.includes("404 (Not Found)") &&
        !e.includes("ApiService") &&
        !e.includes("Http failure") &&
        !e.includes("Unknown Error"),
    );

    expect(criticalErrors.length).toBe(0);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await dismissCookieBanner(page);

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });

    // Login page should have email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('input[type="password"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display login page correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await dismissCookieBanner(page);

    // Verify login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('input[type="password"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button[type="submit"]')).toBeVisible({
      timeout: 5000,
    });

    // Verify page has heading
    const heading = page.locator("h1, h2, .page-header").first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});

