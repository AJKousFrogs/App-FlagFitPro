import { test, expect } from "@playwright/test";

test.describe("Dashboard Navigation and Core Features", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login.html");
    await page.fill("#email", "athlete@example.com");
    await page.fill("#password", "TestPassword123!");
    await page.click("#login-btn");
    await page.waitForURL("/dashboard.html");
  });

  test("should display dashboard with all key components", async ({ page }) => {
    // Verify main dashboard elements
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(page.locator("#welcome-section")).toBeVisible();
    await expect(page.locator("#quick-stats")).toBeVisible();
    await expect(page.locator("#recent-activity")).toBeVisible();
    await expect(page.locator("#performance-charts")).toBeVisible();

    // Verify navigation menu
    await expect(page.locator("#nav-training")).toBeVisible();
    await expect(page.locator("#nav-analytics")).toBeVisible();
    await expect(page.locator("#nav-nutrition")).toBeVisible();
    await expect(page.locator("#nav-community")).toBeVisible();

    // Verify user info display
    await expect(page.locator("#user-profile-section")).toContainText(
      "athlete@example.com",
    );
  });

  test("should navigate between main sections", async ({ page }) => {
    // Test Training navigation
    await page.click("#nav-training");
    await page.waitForURL("/training.html");
    await expect(page.locator("h1")).toContainText("Training");

    // Test Analytics navigation
    await page.click("#nav-analytics");
    await page.waitForURL("/analytics.html");
    await expect(page.locator("h1")).toContainText("Analytics");

    // Test Nutrition navigation
    await page.click("#nav-nutrition");
    await page.waitForURL("/nutrition.html");
    await expect(page.locator("h1")).toContainText("Nutrition");

    // Test Community navigation
    await page.click("#nav-community");
    await page.waitForURL("/community.html");
    await expect(page.locator("h1")).toContainText("Community");

    // Return to Dashboard
    await page.click("#nav-dashboard");
    await page.waitForURL("/dashboard.html");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should display real-time performance data", async ({ page }) => {
    // Verify performance widgets
    await expect(page.locator("#current-speed")).toBeVisible();
    await expect(page.locator("#current-endurance")).toBeVisible();
    await expect(page.locator("#current-agility")).toBeVisible();

    // Check for data updates
    const speedValue = await page.locator("#speed-value").textContent();
    expect(speedValue).toMatch(/\d+\.?\d*/);

    // Verify performance trends chart
    await expect(page.locator("#performance-trend-chart")).toBeVisible();
    await expect(page.locator("#chart-legend")).toBeVisible();
  });

  test("should handle quick actions from dashboard", async ({ page }) => {
    // Test quick start training
    await page.click("#quick-start-training");
    await expect(page.locator("#quick-session-modal")).toBeVisible();
    await page.selectOption("#quick-session-type", "speed_work");
    await page.click("#start-quick-session");
    await page.waitForURL("/training.html");

    // Return to dashboard
    await page.goto("/dashboard.html");

    // Test quick nutrition log
    await page.click("#quick-nutrition-log");
    await expect(page.locator("#nutrition-quick-modal")).toBeVisible();
    await page.fill("#quick-meal", "Post-workout protein shake");
    await page.fill("#quick-calories", "250");
    await page.click("#save-quick-nutrition");
    await expect(page.locator(".success-message")).toContainText(
      "Nutrition logged",
    );

    // Test quick coach chat
    await page.click("#quick-coach-chat");
    await expect(page.locator("#ai-coach-widget")).toBeVisible();
    await page.fill(
      "#quick-question",
      "How can I improve my 40-yard dash time?",
    );
    await page.click("#send-quick-question");
    await expect(page.locator("#coach-response")).toBeVisible();
  });

  test("should display upcoming events and reminders", async ({ page }) => {
    // Verify calendar widget
    await expect(page.locator("#upcoming-events")).toBeVisible();
    await expect(page.locator("#calendar-widget")).toBeVisible();

    // Check for training reminders
    await expect(page.locator("#training-reminders")).toBeVisible();

    // Interact with calendar
    await page.click("#calendar-next-week");
    await expect(page.locator("#calendar-week-display")).not.toContainText(
      "This Week",
    );

    // Add quick reminder
    await page.click("#add-reminder-btn");
    await page.fill("#reminder-text", "Team practice at 6 PM");
    await page.fill("#reminder-date", "2025-01-20");
    await page.click("#save-reminder");
    await expect(page.locator(".reminder-item")).toContainText("Team practice");
  });

  test("should show recent activity feed", async ({ page }) => {
    // Verify activity feed
    await expect(page.locator("#activity-feed")).toBeVisible();
    await expect(page.locator(".activity-item")).toHaveCount.greaterThan(0);

    // Check activity types
    const activities = page.locator(".activity-item");
    const activityCount = await activities.count();

    // Create promises array to avoid await in loop
    const checkPromises = [];
    for (let i = 0; i < Math.min(activityCount, 3); i++) {
      const activity = activities.nth(i);
      checkPromises.push(expect(activity).toBeVisible());
      checkPromises.push(expect(activity.locator(".activity-type")).toBeVisible());
      checkPromises.push(expect(activity.locator(".activity-time")).toBeVisible());
    }
    await Promise.all(checkPromises);

    // Test activity filtering
    await page.selectOption("#activity-filter", "training");
    await expect(
      page.locator('.activity-item[data-type="training"]'),
    ).toBeVisible();

    await page.selectOption("#activity-filter", "nutrition");
    await expect(
      page.locator('.activity-item[data-type="nutrition"]'),
    ).toBeVisible();
  });

  test("should handle responsive navigation on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile navigation
    await expect(page.locator("#mobile-nav-toggle")).toBeVisible();
    await expect(page.locator("#main-nav")).not.toBeVisible();

    // Open mobile menu
    await page.click("#mobile-nav-toggle");
    await expect(page.locator("#main-nav")).toBeVisible();

    // Test mobile navigation
    await page.click("#nav-training");
    await page.waitForURL("/training.html");
    await expect(page.locator("h1")).toContainText("Training");

    // Verify menu closes after navigation
    await expect(page.locator("#main-nav")).not.toBeVisible();
  });

  test("should display personalized recommendations", async ({ page }) => {
    // Verify recommendation widgets
    await expect(page.locator("#recommendations-section")).toBeVisible();
    await expect(page.locator("#training-recommendations")).toBeVisible();
    await expect(page.locator("#nutrition-recommendations")).toBeVisible();

    // Check recommendation content
    await expect(page.locator(".recommendation-item")).toHaveCount.greaterThan(
      0,
    );

    // Interact with recommendations
    await page.click(".recommendation-item:first-child .accept-btn");
    await expect(page.locator(".success-message")).toContainText(
      "Recommendation applied",
    );

    // Dismiss recommendation
    await page.click(".recommendation-item:nth-child(2) .dismiss-btn");
    const dismissedRecommendations = await page
      .locator(".recommendation-item")
      .count();
    expect(dismissedRecommendations).toBeGreaterThan(0);
  });

  test("should handle dashboard customization", async ({ page }) => {
    // Access customization mode
    await page.click("#customize-dashboard-btn");
    await expect(page.locator("#customization-panel")).toBeVisible();

    // Test widget reordering
    const widget1 = page.locator("#widget-performance-stats");
    const widget2 = page.locator("#widget-recent-activity");

    // Drag and drop simulation (simplified)
    await widget1.hover();
    await page.mouse.down();
    await widget2.hover();
    await page.mouse.up();

    // Save customization
    await page.click("#save-customization");
    await expect(page.locator(".success-message")).toContainText(
      "Dashboard customized",
    );

    // Test widget toggle
    await page.click("#customize-dashboard-btn");
    await page.uncheck("#widget-toggle-calendar");
    await page.click("#save-customization");
    await expect(page.locator("#calendar-widget")).not.toBeVisible();

    // Re-enable widget
    await page.click("#customize-dashboard-btn");
    await page.check("#widget-toggle-calendar");
    await page.click("#save-customization");
    await expect(page.locator("#calendar-widget")).toBeVisible();
  });

  test("should handle notifications and alerts", async ({ page }) => {
    // Verify notification center - use correct selectors
    const bell = page.locator("#notification-bell");
    await expect(bell).toBeVisible();

    // Open notification panel
    await bell.click();
    const panel = page.locator("#notification-panel");
    await expect(panel).toHaveClass(/is-open/);

    // Wait for notifications to load (may be empty, loading, or have items)
    await page.waitForTimeout(1000);

    // Check if notifications exist (may be empty)
    const items = page.locator(".notification-item");
    const itemCount = await items.count();

    if (itemCount > 0) {
      // Mark notification as read if mark-read button exists
      const markReadBtn = page.locator(".notification-mark-read").first();
      if ((await markReadBtn.count()) > 0) {
        await markReadBtn.click();
        await page.waitForTimeout(500);

        // Notification should be marked as read
        await expect(items.first()).toHaveClass(/read/);
      }

      // Mark all as read
      const markAllBtn = page.locator(".notification-action-btn");
      if ((await markAllBtn.count()) > 0) {
        await markAllBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Close panel
    await bell.click();
    await expect(panel).not.toHaveClass(/is-open/);
  });

  test("should handle dark mode toggle", async ({ page }) => {
    // Verify light mode initially
    const bodyClass = await page.locator("body").getAttribute("class");
    expect(bodyClass).not.toContain("dark-mode");

    // Toggle to dark mode
    await page.click("#dark-mode-toggle");
    await expect(page.locator("body")).toHaveClass(/dark-mode/);

    // Verify dark mode elements
    await expect(page.locator("#dashboard-header")).toHaveClass(/dark/);
    await expect(page.locator("#main-content")).toHaveClass(/dark/);

    // Toggle back to light mode
    await page.click("#dark-mode-toggle");
    await expect(page.locator("body")).not.toHaveClass(/dark-mode/);

    // Verify setting persistence
    await page.reload();
    await expect(page.locator("body")).not.toHaveClass(/dark-mode/);
  });
});
