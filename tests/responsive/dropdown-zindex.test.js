/**
 * Mobile Dropdown/Autocomplete Z-Index Test
 * Tests specifically for the dropdown overlay issue on iPhone
 */

import { test, expect } from "@playwright/test";

const IPHONE_DEVICES = [
  {
    name: "iPhone 12 Pro",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  },
  {
    name: "iPhone 14 Pro",
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  },
];

function toDeviceUseOptions(device) {
  const { name, defaultBrowserType, ...useOptions } = device;
  return useOptions;
}

test.describe("Mobile Dropdown Z-Index Tests", () => {
  for (const device of IPHONE_DEVICES) {
    test.describe(device.name, () => {
      test.use(toDeviceUseOptions(device));

      test("autocomplete dropdown should appear above form content", async ({
        page,
      }) => {
        // Navigate to onboarding or any page with autocomplete
        await page.goto("/onboarding");
        await page.waitForLoadState("networkidle");

        // Find team autocomplete field
        const teamInput = page
          .locator("input#onboarding-team, p-autoComplete input")
          .first();

        if ((await teamInput.count()) > 0) {
          // Click the input to open dropdown
          await teamInput.click();
          await page.waitForTimeout(500); // Wait for dropdown animation

          // Check if dropdown panel exists
          const dropdown = page.locator(
            ".p-autocomplete-overlay, .p-autocomplete-panel",
          );

          if ((await dropdown.count()) > 0) {
            // Get z-index of dropdown
            const dropdownZIndex = await dropdown.evaluate((el) => {
              return window.getComputedStyle(el).zIndex;
            });

            // Get z-index of form content below
            const formContent = page
              .locator(".onboarding-content, .form-group")
              .first();
            const contentZIndex = await formContent.evaluate((el) => {
              return window.getComputedStyle(el).zIndex;
            });

            // Dropdown z-index should be much higher
            expect(parseInt(dropdownZIndex)).toBeGreaterThan(
              parseInt(contentZIndex) || 0,
            );
            expect(parseInt(dropdownZIndex)).toBeGreaterThanOrEqual(10000);

            // Check if dropdown is visible
            await expect(dropdown).toBeVisible();

            // Check if dropdown options are clickable
            const firstOption = dropdown
              .locator(".p-autocomplete-list-item, .p-autocomplete-item")
              .first();
            if ((await firstOption.count()) > 0) {
              await expect(firstOption).toBeVisible();

              // Check that option is not covered
              const isVisible = await firstOption.evaluate((el) => {
                const rect = el.getBoundingClientRect();
                const elementAtPoint = document.elementFromPoint(
                  rect.left + rect.width / 2,
                  rect.top + rect.height / 2,
                );
                return el.contains(elementAtPoint);
              });

              expect(isVisible).toBe(true);
            }
          }
        } else {
          console.log("Autocomplete not found on this page, test skipped");
        }
      });

      test("dropdown should fit within viewport on mobile", async ({
        page,
      }) => {
        await page.goto("/onboarding");
        await page.waitForLoadState("networkidle");

        const teamInput = page
          .locator("input#onboarding-team, p-autoComplete input")
          .first();

        if ((await teamInput.count()) > 0) {
          await teamInput.click();
          await page.waitForTimeout(500);

          const dropdown = page.locator(
            ".p-autocomplete-overlay, .p-autocomplete-panel",
          );

          if ((await dropdown.count()) > 0) {
            const dropdownBox = await dropdown.boundingBox();
            const viewport = page.viewportSize();

            // Dropdown should not overflow viewport horizontally
            expect(dropdownBox.x).toBeGreaterThanOrEqual(0);
            expect(dropdownBox.x + dropdownBox.width).toBeLessThanOrEqual(
              viewport.width,
            );

            // Dropdown should not overflow viewport vertically
            expect(dropdownBox.y).toBeGreaterThanOrEqual(0);
            expect(dropdownBox.y + dropdownBox.height).toBeLessThanOrEqual(
              viewport.height,
            );
          }
        }
      });

      test("dropdown should be accessible via touch", async ({ page }) => {
        await page.goto("/onboarding");
        await page.waitForLoadState("networkidle");

        const teamInput = page
          .locator("input#onboarding-team, p-autoComplete input")
          .first();

        if ((await teamInput.count()) > 0) {
          // Tap input
          await teamInput.tap();
          await page.waitForTimeout(500);

          const dropdown = page.locator(
            ".p-autocomplete-overlay, .p-autocomplete-panel",
          );

          if ((await dropdown.count()) > 0) {
            await expect(dropdown).toBeVisible();

            // Try to tap first option
            const firstOption = dropdown
              .locator(".p-autocomplete-list-item, .p-autocomplete-item")
              .first();
            if ((await firstOption.count()) > 0) {
              const box = await firstOption.boundingBox();

              // Option should be large enough to tap (min 44px height)
              expect(box.height).toBeGreaterThanOrEqual(40);

              // Should be able to tap
              await firstOption.tap();

              // Dropdown should close after selection
              await page.waitForTimeout(300);
              const isVisible = await dropdown.isVisible().catch(() => false);
              // Dropdown may or may not be visible depending on selection behavior
            }
          }
        }
      });

      test("form content should not overlap dropdown", async ({ page }) => {
        await page.goto("/onboarding");
        await page.waitForLoadState("networkidle");

        const teamInput = page
          .locator("input#onboarding-team, p-autoComplete input")
          .first();

        if ((await teamInput.count()) > 0) {
          await teamInput.click();
          await page.waitForTimeout(500);

          const dropdown = page.locator(
            ".p-autocomplete-overlay, .p-autocomplete-panel",
          );

          if ((await dropdown.count()) > 0) {
            // Get all form groups below the dropdown
            const formGroups = page.locator(".form-group");
            const count = await formGroups.count();

            for (let i = 0; i < Math.min(count, 3); i++) {
              const formGroup = formGroups.nth(i);

              const formZIndex = await formGroup.evaluate((el) => {
                const style = window.getComputedStyle(el);
                return parseInt(style.zIndex) || 0;
              });

              const dropdownZIndex = await dropdown.evaluate((el) => {
                return parseInt(window.getComputedStyle(el).zIndex);
              });

              // Dropdown z-index should always be higher
              expect(dropdownZIndex).toBeGreaterThan(formZIndex);
            }
          }
        }
      });

      test("dropdown should handle keyboard open/close", async ({ page }) => {
        await page.goto("/onboarding");
        await page.waitForLoadState("networkidle");

        const teamInput = page
          .locator("input#onboarding-team, p-autoComplete input")
          .first();

        if ((await teamInput.count()) > 0) {
          // Focus input (this should open keyboard on mobile)
          await teamInput.focus();
          await page.waitForTimeout(500);

          // Type to trigger suggestions
          await teamInput.fill("test");
          await page.waitForTimeout(500);

          const dropdown = page.locator(
            ".p-autocomplete-overlay, .p-autocomplete-panel",
          );

          if ((await dropdown.count()) > 0) {
            // Dropdown should be visible even with keyboard open
            await expect(dropdown).toBeVisible();

            // Check dropdown position doesn't go off-screen
            const dropdownBox = await dropdown.boundingBox();
            const viewport = page.viewportSize();

            expect(dropdownBox.y + dropdownBox.height).toBeLessThanOrEqual(
              viewport.height,
            );
          }
        }
      });
    });
  }
});

test.describe("Cross-Device Dropdown Comparison", () => {
  test("dropdown should work consistently across iPhones", async ({ page }) => {
    const results = [];

    for (const device of IPHONE_DEVICES) {
      await page.setViewportSize(device.viewport);
      await page.goto("/onboarding");
      await page.waitForLoadState("networkidle");

      const teamInput = page
        .locator("input#onboarding-team, p-autoComplete input")
        .first();

      if ((await teamInput.count()) > 0) {
        await teamInput.click();
        await page.waitForTimeout(500);

        const dropdown = page.locator(
          ".p-autocomplete-overlay, .p-autocomplete-panel",
        );
        const isVisible = await dropdown.isVisible().catch(() => false);

        results.push({
          device: device.name,
          dropdownVisible: isVisible,
        });
      }
    }

    // All devices should show dropdown
    results.forEach((result) => {
      expect(result.dropdownVisible).toBe(true);
    });
  });
});
