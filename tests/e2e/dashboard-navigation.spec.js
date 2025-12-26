import { test, expect } from "@playwright/test";

/**
 * Dashboard Navigation E2E Tests
 *
 * Note: These tests verify navigation structure and UI elements.
 * Protected routes redirect to login, which is the expected behavior.
 */
test.describe("Dashboard Navigation and Core Features", () => {
  test.beforeEach(async ({ page }) => {
    // Clear state
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("should redirect to login when accessing protected dashboard route", async ({
    page,
  }) => {
    // Try to access dashboard without authentication
    await page.goto("/dashboard");

    // Should be redirected to login
    await page.waitForURL(/\/login/);
    await expect(page.locator("h1.login-title")).toContainText(
      "Sign in to FlagFit Pro"
    );
  });

  test("should redirect to login when accessing protected training route", async ({
    page,
  }) => {
    // Try to access training without authentication
    await page.goto("/training");

    // Should be redirected to login
    await page.waitForURL(/\/login/);
    await expect(page.locator("h1.login-title")).toContainText(
      "Sign in to FlagFit Pro"
    );
  });

  test("should redirect to login when accessing protected analytics route", async ({
    page,
  }) => {
    // Try to access analytics without authentication
    await page.goto("/analytics");

    // Should be redirected to login
    await page.waitForURL(/\/login/);
  });

  test("should redirect to login when accessing protected wellness route", async ({
    page,
  }) => {
    // Try to access wellness without authentication
    await page.goto("/wellness");

    // Should be redirected to login
    await page.waitForURL(/\/login/);
  });

  test("should redirect to login when accessing protected profile route", async ({
    page,
  }) => {
    // Try to access profile without authentication
    await page.goto("/profile");

    // Should be redirected to login
    await page.waitForURL(/\/login/);
  });

  test("should allow access to public landing page", async ({ page }) => {
    await page.goto("/");

    // Landing page should be accessible
    await page.waitForSelector("app-landing", { timeout: 10000 });
    await expect(page.locator("h1.hero-title")).toContainText(
      "Elevate Your Flag Football Game"
    );
  });

  test("should allow access to public login page", async ({ page }) => {
    await page.goto("/login");

    // Login page should be accessible
    await page.waitForSelector("app-login", { timeout: 10000 });
    await expect(page.locator("h1.login-title")).toContainText(
      "Sign in to FlagFit Pro"
    );
  });

  test("should allow access to public register page", async ({ page }) => {
    await page.goto("/register");

    // Register page should be accessible
    await page.waitForSelector("app-register", { timeout: 10000 });
    await expect(page.locator("h1.register-title")).toContainText(
      "Create Your Account"
    );
  });

  test("should allow access to public reset-password page", async ({ page }) => {
    await page.goto("/reset-password");

    // Reset password page should be accessible
    await page.waitForSelector("app-reset-password", { timeout: 10000 });
  });

  test("should preserve return URL when redirecting to login", async ({
    page,
  }) => {
    // Try to access dashboard without authentication
    await page.goto("/dashboard");

    // Should be redirected to login with returnUrl
    await page.waitForURL(/\/login\?returnUrl/);

    // Verify the returnUrl parameter contains dashboard
    const url = page.url();
    expect(url).toContain("returnUrl");
    expect(url).toContain("dashboard");
  });

  test("should handle unknown routes gracefully", async ({ page }) => {
    // Try to access a non-existent route
    await page.goto("/nonexistent-page");

    // Should redirect to landing page (wildcard route)
    await page.waitForURL(/^http:\/\/localhost:\d+\/$/);
    await expect(page.locator("app-landing")).toBeVisible();
  });
});
