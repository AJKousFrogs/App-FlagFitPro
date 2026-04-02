import { test, expect } from "@playwright/test";

test.describe("Basic Navigation", () => {
  test("should navigate to the dashboard page", async ({ page }) => {
    await page.goto("/"); // Assuming root path leads to dashboard or login
    await expect(page).toHaveURL("/dashboard"); // Adjust if login is the default
    await expect(page.locator("h1")).toContainText("Dashboard"); // Verify a key element on the dashboard
  });

  test("should navigate to login page when not authenticated", async ({ page }) => {
    await page.goto("/dashboard"); // Start on a protected page
    await expect(page).toHaveURL("/login"); // Expect redirection to login
  });

  test("should navigate between main sections", async ({ page }) => {
    // Assuming login is handled or test runs after login
    await page.goto("/dashboard");

    // Test navigation to Exercises
    await page.click("text=Exercises");
    await expect(page).toHaveURL("/exercises");
    await expect(page.locator("h1")).toContainText("Exercise Library");

    // Test navigation to Training
    await page.click("text=Training");
    await expect(page).toHaveURL("/training");
    await expect(page.locator("h1")).toContainText("Training");
  });

  test("should open and close sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator(".sidebar");
    const toggleButton = page.locator(".mobile-hamburger"); // Or the appropriate toggle

    // Sidebar should be hidden on mobile by default (or based on viewport)
    // For desktop, it might be visible or collapsible

    // Assuming mobile viewport for testing collapse/expand
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    await toggleButton.click();
    await expect(sidebar).toBeVisible();

    await page.click(".sidebar-backdrop"); // Click outside to close
    await expect(sidebar).not.toBeVisible();
  });
});
