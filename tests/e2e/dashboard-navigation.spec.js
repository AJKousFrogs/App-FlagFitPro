import { test, expect } from "@playwright/test";

/**
 * Dashboard Navigation E2E Tests
 *
 * Tests navigation structure, UI elements, and protected route behavior
 * for the FlagFit Pro Angular application.
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

  test.describe("Protected Route Redirects", () => {
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

    test("should redirect to login when accessing protected community route", async ({
      page,
    }) => {
      // Try to access community without authentication
      await page.goto("/community");

      // Should be redirected to login
      await page.waitForURL(/\/login/);
    });

    test("should redirect to login when accessing protected coach route", async ({
      page,
    }) => {
      // Try to access coach dashboard without authentication
      await page.goto("/coach");

      // Should be redirected to login
      await page.waitForURL(/\/login/);
    });
  });

  test.describe("Public Route Access", () => {
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

    test("should allow access to public reset-password page", async ({
      page,
    }) => {
      await page.goto("/reset-password");

      // Reset password page should be accessible
      await page.waitForSelector("app-reset-password", { timeout: 10000 });
    });
  });

  test.describe("Return URL Handling", () => {
    test("should preserve return URL when redirecting to login from dashboard", async ({
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

    test("should preserve return URL when redirecting to login from training", async ({
      page,
    }) => {
      // Try to access training without authentication
      await page.goto("/training");

      // Should be redirected to login with returnUrl
      await page.waitForURL(/\/login\?returnUrl/);

      // Verify the returnUrl parameter contains training
      const url = page.url();
      expect(url).toContain("returnUrl");
      expect(url).toContain("training");
    });

    test("should preserve return URL when redirecting to login from analytics", async ({
      page,
    }) => {
      // Try to access analytics without authentication
      await page.goto("/analytics");

      // Should be redirected to login with returnUrl
      await page.waitForURL(/\/login\?returnUrl/);

      const url = page.url();
      expect(url).toContain("returnUrl");
      expect(url).toContain("analytics");
    });
  });

  test.describe("Unknown Route Handling", () => {
    test("should handle unknown routes gracefully", async ({ page }) => {
      // Try to access a non-existent route
      await page.goto("/nonexistent-page");

      // Should redirect to landing page (wildcard route)
      await page.waitForURL(/^http:\/\/localhost:\d+\/$/);
      await expect(page.locator("app-landing")).toBeVisible();
    });

    test("should handle deeply nested unknown routes", async ({ page }) => {
      // Try to access a deeply nested non-existent route
      await page.goto("/some/deeply/nested/nonexistent/path");

      // Should redirect to landing page
      await page.waitForURL(/^http:\/\/localhost:\d+\/$/);
      await expect(page.locator("app-landing")).toBeVisible();
    });
  });

  test.describe("Landing Page Features", () => {
    test("should display hero section with CTA", async ({ page }) => {
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Verify hero section
      await expect(page.locator("h1.hero-title")).toBeVisible();
      await expect(page.locator("h1.hero-title")).toContainText(
        "Elevate Your Flag Football Game"
      );

      // Verify CTA buttons exist
      const ctaButtons = page.locator(".hero-cta a, .hero-cta button");
      await expect(ctaButtons.first()).toBeVisible();
    });

    test("should have navigation links to login and register", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Check for login link
      const loginLink = page.locator("a[href='/login']").first();
      await expect(loginLink).toBeVisible();

      // Check for register link
      const registerLink = page.locator("a[href='/register']").first();
      await expect(registerLink).toBeVisible();
    });

    test("should navigate to login from landing page", async ({ page }) => {
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Click login link
      await page.click("a[href='/login']");

      // Should navigate to login page
      await page.waitForURL(/\/login/);
      await expect(page.locator("app-login")).toBeVisible();
    });

    test("should navigate to register from landing page", async ({ page }) => {
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Click register link (first one found)
      await page.click("a[href='/register']");

      // Should navigate to register page
      await page.waitForURL(/\/register/);
      await expect(page.locator("app-register")).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("should display mobile-friendly layout on small screens", async ({
      page,
    }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Verify landing page is visible on mobile
      await expect(page.locator("h1.hero-title")).toBeVisible();
    });

    test("should display tablet-friendly layout", async ({ page }) => {
      // Set viewport to tablet size
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Verify landing page is visible on tablet
      await expect(page.locator("h1.hero-title")).toBeVisible();
    });

    test("should display desktop layout on large screens", async ({ page }) => {
      // Set viewport to desktop size
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Verify landing page is visible on desktop
      await expect(page.locator("h1.hero-title")).toBeVisible();
    });

    test("should have responsive login form on mobile", async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Verify form fields are visible and usable on mobile
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
    });
  });

  test.describe("Page Load Performance", () => {
    test("should load landing page within acceptable time", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test("should load login page within acceptable time", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe("Browser History Navigation", () => {
    test("should handle back navigation correctly", async ({ page }) => {
      // Navigate through pages
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Go back
      await page.goBack();

      // Should be on landing page
      await page.waitForSelector("app-landing", { timeout: 10000 });
    });

    test("should handle forward navigation correctly", async ({ page }) => {
      // Navigate through pages
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Go back then forward
      await page.goBack();
      await page.waitForSelector("app-landing", { timeout: 10000 });

      await page.goForward();

      // Should be on login page
      await page.waitForSelector("app-login", { timeout: 10000 });
    });
  });

  test.describe("Error States", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      await page.goto("/", { waitUntil: "domcontentloaded" }).catch(() => {
        // Expected to fail
      });

      // Restore online mode
      await page.context().setOffline(false);
    });
  });
});
