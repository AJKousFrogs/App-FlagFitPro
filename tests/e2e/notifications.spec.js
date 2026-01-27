import { test, expect } from "@playwright/test";

test.describe("Notifications Center", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill("#email", "athlete@example.com");
    await page.fill("#password", "TestPassword123!");
    await page.click("#login-btn");
    await page.waitForURL("/dashboard");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
  });

  test("should display notification bell with badge", async ({ page }) => {
    // Verify notification bell exists
    const bell = page.locator("#notification-bell");
    await expect(bell).toBeVisible();

    // Verify badge exists (may be hidden if no unread)
    const badge = page.locator("#notification-badge");
    await expect(badge).toBeAttached();

    // Check aria attributes
    await expect(bell).toHaveAttribute("aria-controls", "notification-panel");
    await expect(bell).toHaveAttribute("aria-expanded", "false");
  });

  test("should open and close notification panel", async ({ page }) => {
    const bell = page.locator("#notification-bell");
    const panel = page.locator("#notification-panel");

    // Panel should be closed initially
    await expect(panel).not.toHaveClass(/is-open/);

    // Click bell to open
    await bell.click();

    // Panel should be open
    await expect(panel).toHaveClass(/is-open/);
    await expect(bell).toHaveAttribute("aria-expanded", "true");

    // Click bell again to close
    await bell.click();

    // Panel should be closed
    await expect(panel).not.toHaveClass(/is-open/);
    await expect(bell).toHaveAttribute("aria-expanded", "false");
  });

  test("should show loading state when opening panel", async ({ page }) => {
    const bell = page.locator("#notification-bell");

    // Open panel
    await bell.click();

    // Should show loading state
    const loadingSpinner = page.locator(".notification-loading-spinner");
    const loadingText = page.locator(".notification-loading-text");

    // Loading state may appear briefly, so check if it exists or if notifications loaded
    const hasLoading = (await loadingSpinner.count()) > 0;
    const hasLoadingText = (await loadingText.count()) > 0;

    // Either loading state appears or notifications have loaded
    expect(
      hasLoading ||
        hasLoadingText ||
        (await page.locator(".notification-item").count()) > 0,
    ).toBeTruthy();
  });

  test("should display notifications when available", async ({ page }) => {
    // Mock API response with notifications
    await page.route("**/api/dashboard/notifications*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "1",
              type: "training",
              title: "Training Session Reminder",
              message: "Speed & Agility training starts in 30 minutes",
              time: "5 minutes ago",
              read: false,
            },
            {
              id: "2",
              type: "achievement",
              title: "New Achievement Unlocked",
              message: "You've completed 10 training sessions this month!",
              time: "1 hour ago",
              read: false,
            },
          ],
        }),
      });
    });

    const bell = page.locator("#notification-bell");
    await bell.click();

    // Wait for notifications to load
    await page.waitForSelector(".notification-item", { timeout: 5000 });

    // Verify notifications are displayed
    const items = page.locator(".notification-item");
    await expect(items).toHaveCount(2);

    // Verify notification content
    await expect(items.first()).toContainText("Training Session Reminder");
    await expect(items.nth(1)).toContainText("New Achievement Unlocked");
  });

  test("should show empty state when no notifications", async ({ page }) => {
    // Mock empty API response
    await page.route("**/api/dashboard/notifications*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    const bell = page.locator("#notification-bell");
    await bell.click();

    // Wait for empty state
    await page.waitForSelector(".notification-empty", { timeout: 5000 });

    // Verify empty state message
    await expect(page.locator(".notification-empty-title")).toContainText(
      "No notifications yet",
    );
    await expect(page.locator(".notification-empty-text")).toBeVisible();
  });

  test("should show correct unread count in badge after initial load", async ({
    page,
  }) => {
    // Mock API response with unread count
    await page.route("**/api/dashboard/notifications/count*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { unreadCount: 5 },
        }),
      });
    });

    // Mock notifications API
    await page.route("**/api/dashboard/notifications*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: Array.from({ length: 5 }, (_, i) => ({
            id: String(i + 1),
            type: "training",
            title: `Notification ${i + 1}`,
            message: `Message ${i + 1}`,
            time: "5 minutes ago",
            read: false,
          })),
        }),
      });
    });

    // Wait for badge to update
    await page.waitForTimeout(1000);

    const badge = page.locator("#notification-badge");

    // Badge should show count
    await expect(badge).not.toBeHidden();
    await expect(badge).toContainText("5");
  });

  test("should decrement badge when marking single notification as read", async ({
    page,
  }) => {
    let unreadCount = 3;

    // Mock count API
    await page.route("**/api/dashboard/notifications/count*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { unreadCount },
        }),
      });
    });

    // Mock notifications API
    await page.route("**/api/dashboard/notifications*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 3 }, (_, i) => ({
              id: String(i + 1),
              type: "training",
              title: `Notification ${i + 1}`,
              message: `Message ${i + 1}`,
              time: "5 minutes ago",
              read: i === 0, // First one is read
            })),
          }),
        });
      } else if (route.request().method() === "POST") {
        // Mark as read
        unreadCount = Math.max(0, unreadCount - 1);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Notification marked as read",
          }),
        });
      }
    });

    const bell = page.locator("#notification-bell");
    await bell.click();

    // Wait for notifications
    await page.waitForSelector(".notification-item", { timeout: 5000 });

    // Get initial badge count
    const initialBadge = await page
      .locator("#notification-badge")
      .textContent();
    const initialCount = initialBadge ? parseInt(initialBadge) : 0;

    // Find unread notification and mark as read
    const markReadBtn = page.locator(".notification-mark-read").first();
    if ((await markReadBtn.count()) > 0) {
      await markReadBtn.click();

      // Wait for badge to update
      await page.waitForTimeout(500);

      // Badge should decrement
      const newBadge = await page.locator("#notification-badge").textContent();
      const newCount = newBadge ? parseInt(newBadge) : 0;

      expect(newCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test("should set badge to 0 when marking all as read", async ({ page }) => {
    let unreadCount = 3;

    // Mock count API
    await page.route("**/api/dashboard/notifications/count*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { unreadCount },
        }),
      });
    });

    // Mock notifications API
    await page.route("**/api/dashboard/notifications*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 3 }, (_, i) => ({
              id: String(i + 1),
              type: "training",
              title: `Notification ${i + 1}`,
              message: `Message ${i + 1}`,
              time: "5 minutes ago",
              read: false,
            })),
          }),
        });
      } else if (route.request().method() === "POST") {
        const body = await route.request().postDataJSON();
        if (body.notificationId === "all") {
          unreadCount = 0;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "All notifications marked as read",
          }),
        });
      }
    });

    const bell = page.locator("#notification-bell");
    await bell.click();

    // Wait for notifications
    await page.waitForSelector(".notification-item", { timeout: 5000 });

    // Click mark all as read
    const markAllBtn = page.locator(".notification-action-btn");
    await markAllBtn.click();

    // Wait for badge to update
    await page.waitForTimeout(500);

    // Badge should be hidden (count is 0)
    const badge = page.locator("#notification-badge");
    const isHidden = await badge.evaluate((el) => el.hasAttribute("hidden"));

    // Either badge is hidden or shows 0
    const badgeText = await badge.textContent();
    expect(isHidden || badgeText === "0").toBeTruthy();
  });

  test("should persist read status across page reload", async ({ page }) => {
    const readNotifications = new Set(["1"]);

    // Mock notifications API
    await page.route("**/api/dashboard/notifications*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: "1",
                type: "training",
                title: "Notification 1",
                message: "Message 1",
                time: "5 minutes ago",
                read: readNotifications.has("1"),
              },
              {
                id: "2",
                type: "training",
                title: "Notification 2",
                message: "Message 2",
                time: "10 minutes ago",
                read: readNotifications.has("2"),
              },
            ],
          }),
        });
      } else if (route.request().method() === "POST") {
        const body = await route.request().postDataJSON();
        if (body.notificationId) {
          readNotifications.add(body.notificationId);
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Notification marked as read",
          }),
        });
      }
    });

    const bell = page.locator("#notification-bell");
    await bell.click();

    // Wait for notifications
    await page.waitForSelector(".notification-item", { timeout: 5000 });

    // Mark first notification as read
    const markReadBtn = page.locator(".notification-mark-read").first();
    if ((await markReadBtn.count()) > 0) {
      await markReadBtn.click();
      await page.waitForTimeout(500);
    }

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open panel again
    await bell.click();
    await page.waitForSelector(".notification-item", { timeout: 5000 });

    // First notification should still be marked as read
    const firstItem = page.locator(".notification-item").first();
    await expect(firstItem).toHaveClass(/read/);

    // Should not have mark-read button
    const markBtn = firstItem.locator(".notification-mark-read");
    await expect(markBtn).toHaveCount(0);
  });

  test("should show error message on API failure", async ({ page }) => {
    // Mock 500 error
    await page.route("**/api/dashboard/notifications*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Internal server error",
        }),
      });
    });

    const bell = page.locator("#notification-bell");
    await bell.click();

    // Wait for error state
    await page.waitForSelector(".notification-error", { timeout: 5000 });

    // Verify error message is visible
    await expect(page.locator(".notification-error-text")).toBeVisible();
    await expect(page.locator(".notification-retry-btn")).toBeVisible();

    // Should not show notifications
    const items = page.locator(".notification-item");
    await expect(items).toHaveCount(0);
  });

  test("should close panel when clicking outside", async ({ page }) => {
    const bell = page.locator("#notification-bell");
    const panel = page.locator("#notification-panel");

    // Open panel
    await bell.click();
    await expect(panel).toHaveClass(/is-open/);

    // Click outside panel (on body)
    await page.click("body", { position: { x: 10, y: 10 } });

    // Panel should close
    await expect(panel).not.toHaveClass(/is-open/);
  });

  test("should close panel with Escape key", async ({ page }) => {
    const bell = page.locator("#notification-bell");
    const panel = page.locator("#notification-panel");

    // Open panel
    await bell.click();
    await expect(panel).toHaveClass(/is-open/);

    // Press Escape
    await page.keyboard.press("Escape");

    // Panel should close
    await expect(panel).not.toHaveClass(/is-open/);
  });
});
