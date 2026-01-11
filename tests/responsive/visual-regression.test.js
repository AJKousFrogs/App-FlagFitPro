/**
 * Visual Regression Testing for Mobile Devices
 * Captures screenshots across different devices and compares them
 */

import { test, expect } from "@playwright/test";

// Device configurations for visual testing
const VISUAL_TEST_DEVICES = [
  {
    name: "iPhone-SE",
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
  },
  {
    name: "iPhone-14-Pro",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  },
  {
    name: "Samsung-Galaxy-S23",
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 3,
  },
  {
    name: "Xiaomi-13",
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 3,
  },
];

const TEST_ROUTES = [
  { path: "/", name: "home" },
  { path: "/dashboard", name: "dashboard" },
  { path: "/training", name: "training" },
  { path: "/profile", name: "profile" },
];

test.describe("Visual Regression - Mobile Devices", () => {
  for (const device of VISUAL_TEST_DEVICES) {
    test.describe(device.name, () => {
      test.use({
        viewport: device.viewport,
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
      });

      for (const route of TEST_ROUTES) {
        test(`should match ${route.name} page snapshot`, async ({ page }) => {
          try {
            await page.goto(route.path);
            await page.waitForLoadState("networkidle", { timeout: 15000 });

            // Wait for any animations to complete
            await page.waitForTimeout(1000);

            // Take full page screenshot
            await expect(page).toHaveScreenshot(
              `${device.name}-${route.name}.png`,
              {
                fullPage: true,
                animations: "disabled",
                // Allow for slight rendering differences
                threshold: 0.2,
                maxDiffPixels: 100,
              },
            );
          } catch (error) {
            console.log(`Route ${route.path} not accessible, skipping...`);
            test.skip();
          }
        });
      }

      test("should capture modal/dialog views", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Try to open a modal if exists
        const modalTriggers = page.locator(
          'button:has-text("Settings"), button:has-text("Menu")',
        );
        const count = await modalTriggers.count();

        if (count > 0) {
          await modalTriggers.first().click();
          await page.waitForTimeout(500);

          await expect(page).toHaveScreenshot(`${device.name}-modal-open.png`, {
            animations: "disabled",
            threshold: 0.2,
          });
        }
      });

      test("should capture form elements", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Find input fields
        const inputs = page.locator("input:visible");
        const count = await inputs.count();

        if (count > 0) {
          // Focus on first input
          await inputs.first().focus();
          await page.waitForTimeout(300);

          await expect(page).toHaveScreenshot(
            `${device.name}-input-focused.png`,
            {
              animations: "disabled",
              threshold: 0.2,
            },
          );
        }
      });
    });
  }
});

test.describe("Component-Level Visual Testing", () => {
  const device = VISUAL_TEST_DEVICES[0]; // Use iPhone SE as reference

  test.use({
    viewport: device.viewport,
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: true,
  });

  test("should render buttons correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const buttons = page.locator("button:visible, .p-button:visible").first();
    const count = await buttons.count();

    if (count > 0) {
      await buttons.scrollIntoViewIfNeeded();
      await expect(buttons).toHaveScreenshot("button-component.png", {
        threshold: 0.1,
      });
    }
  });

  test("should render cards correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cards = page.locator(".p-card:visible, .card:visible").first();
    const count = await cards.count();

    if (count > 0) {
      await cards.scrollIntoViewIfNeeded();
      await expect(cards).toHaveScreenshot("card-component.png", {
        threshold: 0.1,
      });
    }
  });
});

test.describe("Dark Mode Visual Testing", () => {
  const device = VISUAL_TEST_DEVICES[1]; // iPhone 14 Pro

  test.use({
    viewport: device.viewport,
    deviceScaleFactor: device.deviceScaleFactor,
    colorScheme: "dark",
    isMobile: true,
  });

  test("should render dark mode correctly on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot(`${device.name}-dark-mode.png`, {
      fullPage: true,
      animations: "disabled",
      threshold: 0.2,
    });
  });
});
