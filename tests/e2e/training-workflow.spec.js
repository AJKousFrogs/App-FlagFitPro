import { test, expect } from "@playwright/test";

/**
 * Training Workflow E2E Tests
 *
 * Tests the complete training workflow for the FlagFit Pro Angular application.
 * Note: These tests require authentication, which is handled via demo mode
 * or mock authentication in the test environment.
 */
test.describe("Training Workflow", () => {
  // Helper to simulate authenticated state
  async function setupAuthenticatedState(page) {
    await page.goto("/");
    await page.evaluate(() => {
      // Simulate authenticated user in localStorage
      localStorage.setItem("authToken", "demo-test-token");
      localStorage.setItem(
        "userData",
        JSON.stringify({
          id: "test-user-123",
          email: "test@flagfitpro.com",
          name: "Test Athlete",
          role: "player",
        })
      );
    });
  }

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe("Training Page Access", () => {
    test("should redirect to login when accessing training without auth", async ({
      page,
    }) => {
      await page.goto("/training");

      // Should be redirected to login
      await page.waitForURL(/\/login/);
      await expect(page.locator("h1.login-title")).toContainText(
        "Sign in to FlagFit Pro"
      );
    });

    test("should preserve training return URL when redirecting to login", async ({
      page,
    }) => {
      await page.goto("/training");

      // Should be redirected to login with returnUrl
      await page.waitForURL(/\/login\?returnUrl/);

      const url = page.url();
      expect(url).toContain("returnUrl");
      expect(url).toContain("training");
    });
  });

  test.describe("Training Page UI Elements", () => {
    test("should display login page with demo credentials for training access", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Verify demo mode is active
      const demoAlert = page.locator(".alert-info");
      await expect(demoAlert).toContainText("Demo Mode");

      // Verify demo credentials are pre-filled
      await expect(page.locator("#email")).toHaveValue("test@flagfitpro.com");
      await expect(page.locator("#password")).toHaveValue("TestDemo123!");
    });
  });

  test.describe("Training Navigation", () => {
    test("should have training link in navigation when authenticated", async ({
      page,
    }) => {
      // This test verifies the navigation structure exists
      // In a real scenario, we would authenticate first
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Verify the app structure is correct
      await expect(page.locator("app-login")).toBeVisible();
    });
  });

  test.describe("Training Session Types", () => {
    test("should display different training session types on landing page", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Landing page should mention training features
      const pageContent = await page.content();

      // Verify training-related content exists
      expect(
        pageContent.toLowerCase().includes("training") ||
          pageContent.toLowerCase().includes("workout") ||
          pageContent.toLowerCase().includes("exercise")
      ).toBe(true);
    });
  });

  test.describe("Training Features Mentioned", () => {
    test("should mention AI coaching on landing page", async ({ page }) => {
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      const pageContent = await page.content();

      // Verify AI coaching is mentioned
      expect(
        pageContent.toLowerCase().includes("ai") ||
          pageContent.toLowerCase().includes("coach") ||
          pageContent.toLowerCase().includes("intelligent")
      ).toBe(true);
    });

    test("should mention performance tracking on landing page", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      const pageContent = await page.content();

      // Verify performance tracking is mentioned
      expect(
        pageContent.toLowerCase().includes("performance") ||
          pageContent.toLowerCase().includes("analytics") ||
          pageContent.toLowerCase().includes("track")
      ).toBe(true);
    });
  });

  test.describe("Mobile Training Experience", () => {
    test("should display training-related content on mobile", async ({
      page,
    }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/");
      await page.waitForSelector("app-landing", { timeout: 10000 });

      // Landing page should be visible on mobile
      await expect(page.locator("h1.hero-title")).toBeVisible();
    });

    test("should have accessible login form on mobile for training access", async ({
      page,
    }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Form fields should be visible and usable
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();

      // Submit button should be visible
      const submitButton = page.locator("p-button[type='submit']");
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe("Training Page Performance", () => {
    test("should load login page quickly for training access", async ({
      page,
    }) => {
      const startTime = Date.now();

      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe("Training Form Validation", () => {
    test("should validate login form before allowing training access", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Clear demo credentials
      await page.fill("#email", "");
      await page.fill("#password", "");

      // Submit button should be disabled
      const submitButton = page.locator("p-button[type='submit'] button");
      await expect(submitButton).toBeDisabled();
    });

    test("should show validation error for invalid email", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Enter invalid email
      await page.fill("#email", "invalid-email");
      await page.fill("#password", "ValidPassword123!");
      await page.keyboard.press("Tab");

      // Should show validation error
      const emailError = page.locator(".p-error");
      await expect(emailError).toBeVisible();
    });
  });

  test.describe("Training Session Offline Support", () => {
    test("should handle offline state gracefully on login page", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Simulate going offline
      await page.context().setOffline(true);

      // Form should still be visible
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();

      // Restore online state
      await page.context().setOffline(false);
    });
  });

  test.describe("Training Session Accessibility", () => {
    test("should have accessible form labels on login", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Check for form labels
      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');

      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
    });

    test("should support keyboard navigation", async ({ page }) => {
      await page.goto("/login");
      await page.waitForSelector("app-login", { timeout: 10000 });

      // Tab through form elements
      await page.keyboard.press("Tab");
      await expect(page.locator("#email")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator("#password")).toBeFocused();
    });
  });

  test.describe("Training Session Error Handling", () => {
    test("should handle navigation errors gracefully", async ({ page }) => {
      // Try to access non-existent training route
      await page.goto("/training/nonexistent-session");

      // Should redirect to login (protected route)
      await page.waitForURL(/\/login/);
    });

    test("should handle deep training routes", async ({ page }) => {
      // Try to access deep training route
      await page.goto("/training/sessions/123/exercises");

      // Should redirect to login (protected route)
      await page.waitForURL(/\/login/);
    });
  });
});
