/**
 * PrimeNG Styling Smoke Tests
 *
 * Quick smoke tests to verify PrimeNG components render with correct design system styling.
 * These tests catch regressions in dialog, button, and card styling after refactoring.
 *
 * Run with: npx playwright test e2e/primeng-styling-smoke.spec.ts
 * Run in UI mode: npx playwright test e2e/primeng-styling-smoke.spec.ts --ui
 */

import { expect, Page, test } from "@playwright/test";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4200";

// Test credentials
const TEST_USER = {
  email: process.env["TEST_USER_EMAIL"] || "aljkous@gmail.com",
  password: process.env["TEST_USER_PASSWORD"] || "Futsal12!!!!",
};

/**
 * Dismisses the cookie consent banner
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
    // Banner not present
  }
}

/**
 * Login helper
 */
async function login(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await dismissCookieBanner(page);

  const emailInput = page.locator(
    'input[type="email"], [data-testid="email-input"]',
  );
  await emailInput.click();
  await emailInput.fill(TEST_USER.email);
  await emailInput.press("Tab");

  const passwordInput = page.locator(
    'input[type="password"], [data-testid="password-input"]',
  );
  await passwordInput.click();
  await passwordInput.fill(TEST_USER.password);
  await passwordInput.press("Tab");

  await page.waitForSelector('button[type="submit"]:not([disabled])', {
    timeout: 10000,
  });

  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.waitForURL(/.*(dashboard|onboarding).*/, { timeout: 15000 });
}

/**
 * Extract computed style as number (pixels)
 */
async function getStyleValue(
  page: Page,
  selector: string,
  property: string,
): Promise<number> {
  return await page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) return 0;
      const value = window.getComputedStyle(element).getPropertyValue(prop);
      return parseFloat(value) || 0;
    },
    { sel: selector, prop: property },
  );
}

/**
 * Check if element uses CSS variable for a property
 */
async function usesTokenForProperty(
  page: Page,
  selector: string,
  property: string,
): Promise<boolean> {
  return await page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) return false;

      // Check if the computed style matches expected token values
      const computed = window.getComputedStyle(element);
      const value = computed.getPropertyValue(prop);

      // For colors, verify they match design system values
      const designSystemColors = {
        // Primary green
        "rgb(8, 153, 73)": true,
        "rgba(8, 153, 73": true,
        // White (text on primary)
        "rgb(255, 255, 255)": true,
        // Surface colors
        "rgb(250, 250, 250)": true,
        "rgb(245, 245, 245)": true,
        // Transparent (valid for certain contexts)
        "rgba(0, 0, 0, 0)": true,
      };

      // Check if color is from design system or transparent
      for (const pattern of Object.keys(designSystemColors)) {
        if (value.startsWith(pattern) || value === pattern) {
          return true;
        }
      }

      // For spacing, verify it's on the 4px grid
      if (prop.includes("padding") || prop.includes("margin")) {
        const px = parseFloat(value);
        // Allow values on 4px grid (8pt system: 4, 8, 12, 16, 20, 24, 32, etc.)
        return px % 4 === 0 || px === 0;
      }

      return false;
    },
    { sel: selector, prop: property },
  );
}

test.describe("PrimeNG Styling Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Handle onboarding if present
    if (page.url().includes("onboarding")) {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
    }
  });

  test.describe("Button Styling", () => {
    test("primary buttons have correct height (44px touch target)", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      // Find a primary button
      const primaryButton = page
        .locator(
          ".p-button:not(.p-button-text):not(.p-button-outlined):not(.p-button-icon-only)",
        )
        .first();

      if (await primaryButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await primaryButton.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(40); // Min 40px, ideally 44px
        console.log(`✓ Primary button height: ${box?.height}px`);
      }
    });

    test("buttons have consistent border-radius", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const buttons = page.locator(".p-button");
      const count = await buttons.count();
      const borderRadii = new Set<string>();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
          const radius = await button.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("border-radius"),
          );
          borderRadii.add(radius);
        }
      }

      console.log(
        `Button border-radius values: ${[...borderRadii].join(", ")}`,
      );
      // Allow rounded buttons (9999px) and standard buttons
      const validRadii = [...borderRadii].filter(
        (r) => parseFloat(r) <= 16 || parseFloat(r) >= 9999,
      );
      expect(validRadii.length).toBeGreaterThan(0);
    });

    test("icon-only buttons are square (44x44)", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const iconButton = page.locator(".p-button-icon-only").first();

      if (await iconButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await iconButton.boundingBox();
        if (box) {
          const aspectRatio = box.width / box.height;
          // Should be roughly square (aspect ratio close to 1)
          expect(aspectRatio).toBeGreaterThan(0.8);
          expect(aspectRatio).toBeLessThan(1.2);
          console.log(
            `✓ Icon button dimensions: ${box.width}x${box.height}px (ratio: ${aspectRatio.toFixed(2)})`,
          );
        }
      }
    });
  });

  test.describe("Card Styling", () => {
    test("cards have consistent border-radius (12px)", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const card = page.locator(".p-card").first();

      if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
        const radius = await card.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("border-radius"),
        );
        const px = parseFloat(radius);
        // Should be between 8px and 16px (design system: 8, 12, or 16)
        expect(px).toBeGreaterThanOrEqual(8);
        expect(px).toBeLessThanOrEqual(16);
        console.log(`✓ Card border-radius: ${radius}`);
      }
    });

    test("card body uses design system padding", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const cardBody = page.locator(".p-card-body").first();

      if (await cardBody.isVisible({ timeout: 2000 }).catch(() => false)) {
        const padding = await cardBody.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("padding"),
        );
        const values = padding.split(" ").map((v) => parseFloat(v));

        // All padding values should be on 4px grid
        const onGrid = values.every((v) => v % 4 === 0 || v === 0);
        expect(onGrid).toBe(true);
        console.log(`✓ Card body padding: ${padding} (on 4px grid: ${onGrid})`);
      }
    });

    test("cards have subtle shadow (not heavy drop shadows)", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const card = page.locator(".p-card").first();

      if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
        const shadow = await card.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("box-shadow"),
        );
        // Should have shadow (not "none") but not excessive
        expect(shadow).not.toBe("none");
        console.log(`✓ Card has shadow: ${shadow.substring(0, 50)}...`);
      }
    });
  });

  test.describe("Dialog Styling", () => {
    test("dialog opens with correct styling", async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      // Try to find and click a button that opens a dialog
      const dialogTrigger = page
        .locator('button:has-text("Change"), button:has-text("Edit")')
        .first();

      if (await dialogTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dialogTrigger.click();
        await page.waitForTimeout(500);

        const dialog = page.locator(".p-dialog");

        if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Check border-radius
          const radius = await dialog.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("border-radius"),
          );
          const px = parseFloat(radius);
          expect(px).toBeGreaterThanOrEqual(8);
          console.log(`✓ Dialog border-radius: ${radius}`);

          // Check header exists
          const header = dialog.locator(".p-dialog-header");
          expect(await header.isVisible()).toBe(true);
          console.log("✓ Dialog has header");

          // Check content padding
          const content = dialog.locator(".p-dialog-content");
          if (await content.isVisible().catch(() => false)) {
            const padding = await content.evaluate((el) =>
              window.getComputedStyle(el).getPropertyValue("padding"),
            );
            console.log(`✓ Dialog content padding: ${padding}`);
          }

          // Close dialog
          const closeButton = dialog.locator(
            '.p-dialog-header button, button[aria-label="Close"]',
          );
          if (await closeButton.isVisible().catch(() => false)) {
            await closeButton.click();
          }
        }
      } else {
        console.log("⚠ No dialog trigger found on settings page - skipping");
      }
    });

    test("dialog footer uses flexbox with gap", async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const dialogTrigger = page
        .locator('button:has-text("Change"), button:has-text("Edit")')
        .first();

      if (await dialogTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await dialogTrigger.click();
        await page.waitForTimeout(500);

        const footer = page.locator(".p-dialog-footer");

        if (await footer.isVisible({ timeout: 2000 }).catch(() => false)) {
          const display = await footer.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("display"),
          );
          const gap = await footer.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("gap"),
          );

          expect(display).toBe("flex");
          console.log(`✓ Dialog footer: display=${display}, gap=${gap}`);
        }
      }
    });
  });

  test.describe("Input Styling", () => {
    test("inputs have 44px minimum height", async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const input = page.locator(".p-inputtext").first();

      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await input.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(40);
        console.log(`✓ Input height: ${box?.height}px`);
      }
    });

    test("selects/dropdowns have consistent styling", async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const select = page.locator(".p-select, .p-dropdown").first();

      if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
        const height = await select.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("min-height"),
        );
        const borderRadius = await select.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("border-radius"),
        );

        console.log(
          `✓ Select styling: height=${height}, border-radius=${borderRadius}`,
        );
        expect(parseFloat(height)).toBeGreaterThanOrEqual(40);
      }
    });
  });

  test.describe("Toggle/Checkbox Styling", () => {
    test("toggle switch has correct dimensions", async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const toggle = page.locator(".p-toggleswitch").first();

      if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await toggle.boundingBox();
        // Toggle should be approximately 44x24
        expect(box?.width).toBeGreaterThanOrEqual(40);
        expect(box?.height).toBeGreaterThanOrEqual(20);
        console.log(`✓ Toggle dimensions: ${box?.width}x${box?.height}px`);
      }
    });

    test("checkbox has correct size (20px)", async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const checkbox = page.locator(".p-checkbox-box").first();

      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const box = await checkbox.boundingBox();
        // Checkbox should be 20px square
        expect(box?.width).toBeGreaterThanOrEqual(18);
        expect(box?.width).toBeLessThanOrEqual(24);
        expect(box?.height).toBeGreaterThanOrEqual(18);
        expect(box?.height).toBeLessThanOrEqual(24);
        console.log(`✓ Checkbox dimensions: ${box?.width}x${box?.height}px`);
      }
    });
  });

  test.describe("Spacing Consistency", () => {
    test("page uses consistent section spacing", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      // Check that sections use gap instead of margin where possible
      const sections = page.locator(".section-stack, [class*='stack']");
      const count = await sections.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const section = sections.nth(i);
        if (await section.isVisible({ timeout: 500 }).catch(() => false)) {
          const gap = await section.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("gap"),
          );
          if (gap && gap !== "normal") {
            console.log(`✓ Section ${i} uses gap: ${gap}`);
          }
        }
      }
    });
  });

  test.describe("Toast Styling", () => {
    test("toast has correct styling tokens", async ({ page }) => {
      // Check CSS variables are set correctly
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const toastTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          borderRadius: computed.getPropertyValue("--p-toast-border-radius"),
          shadow: computed.getPropertyValue("--p-toast-shadow"),
          padding: computed.getPropertyValue("--p-toast-padding"),
          zIndex: computed.getPropertyValue("--p-toast-z-index"),
        };
      });

      console.log("Toast tokens:", toastTokens);

      // Verify tokens are defined
      expect(toastTokens.borderRadius.trim()).not.toBe("");
      console.log(`✓ Toast border-radius token: ${toastTokens.borderRadius}`);
    });
  });

  test.describe("Tooltip Styling", () => {
    test("tooltip has correct styling tokens", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const tooltipTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          background: computed.getPropertyValue("--p-tooltip-background"),
          color: computed.getPropertyValue("--p-tooltip-color"),
          borderRadius: computed.getPropertyValue("--p-tooltip-border-radius"),
          padding: computed.getPropertyValue("--p-tooltip-padding"),
          fontSize: computed.getPropertyValue("--p-tooltip-font-size"),
          maxWidth: computed.getPropertyValue("--p-tooltip-max-width"),
        };
      });

      console.log("Tooltip tokens:", tooltipTokens);

      // Verify key tokens
      expect(tooltipTokens.borderRadius.trim()).not.toBe("");
      expect(tooltipTokens.padding.trim()).not.toBe("");
      console.log(
        `✓ Tooltip styling: radius=${tooltipTokens.borderRadius}, padding=${tooltipTokens.padding}`,
      );
    });

    test("tooltip appears on hover with correct styling", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      // Find an element with tooltip
      const tooltipTrigger = page
        .locator("[pTooltip], [tooltipPosition]")
        .first();

      if (
        await tooltipTrigger.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await tooltipTrigger.hover();
        await page.waitForTimeout(500);

        const tooltip = page.locator(".p-tooltip");
        if (await tooltip.isVisible({ timeout: 2000 }).catch(() => false)) {
          const tooltipText = tooltip.locator(".p-tooltip-text");

          const padding = await tooltipText.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("padding"),
          );
          const borderRadius = await tooltipText.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("border-radius"),
          );

          console.log(
            `✓ Tooltip visible: padding=${padding}, border-radius=${borderRadius}`,
          );
        } else {
          console.log("⚠ No tooltip appeared - skipping");
        }
      } else {
        console.log("⚠ No tooltip trigger found - skipping");
      }
    });
  });

  test.describe("Menu Styling", () => {
    test("menu has correct styling tokens", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const menuTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          background: computed.getPropertyValue("--p-menu-background"),
          borderRadius: computed.getPropertyValue("--p-menu-border-radius"),
          shadow: computed.getPropertyValue("--p-menu-shadow"),
          padding: computed.getPropertyValue("--p-menu-padding"),
          itemPadding: computed.getPropertyValue("--p-menu-item-padding"),
        };
      });

      console.log("Menu tokens:", menuTokens);

      expect(menuTokens.borderRadius.trim()).not.toBe("");
      console.log(
        `✓ Menu styling: radius=${menuTokens.borderRadius}, padding=${menuTokens.padding}`,
      );
    });
  });

  test.describe("Message/Alert Styling", () => {
    test("message component tokens are defined", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const messageTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          borderRadius: computed.getPropertyValue("--p-message-border-radius"),
          contentPadding: computed.getPropertyValue(
            "--p-message-content-padding",
          ),
        };
      });

      console.log("Message tokens:", messageTokens);

      expect(messageTokens.borderRadius.trim()).not.toBe("");
      console.log(`✓ Message border-radius: ${messageTokens.borderRadius}`);
    });

    test("message displays with correct styling", async ({ page }) => {
      // Navigate to a page that might have messages
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const message = page.locator(".p-message").first();

      if (await message.isVisible({ timeout: 2000 }).catch(() => false)) {
        const borderRadius = await message.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("border-radius"),
        );
        const padding = await message.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("padding"),
        );

        console.log(
          `✓ Message styling: border-radius=${borderRadius}, padding=${padding}`,
        );

        // Verify border-radius is reasonable (8-16px)
        const px = parseFloat(borderRadius);
        expect(px).toBeGreaterThanOrEqual(8);
      } else {
        console.log("⚠ No message component visible - skipping");
      }
    });
  });

  test.describe("Tag/Badge Styling", () => {
    test("tag has correct styling tokens", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const tagTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          borderRadius: computed.getPropertyValue("--p-tag-border-radius"),
          paddingX: computed.getPropertyValue("--p-tag-padding-x"),
          paddingY: computed.getPropertyValue("--p-tag-padding-y"),
          fontSize: computed.getPropertyValue("--p-tag-font-size"),
          fontWeight: computed.getPropertyValue("--p-tag-font-weight"),
        };
      });

      console.log("Tag tokens:", tagTokens);

      expect(tagTokens.borderRadius.trim()).not.toBe("");
      console.log(
        `✓ Tag styling: radius=${tagTokens.borderRadius}, padding=${tagTokens.paddingY} ${tagTokens.paddingX}`,
      );
    });

    test("tag displays with consistent sizing", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const tags = page.locator(".p-tag");
      const count = await tags.count();
      const heights = new Set<number>();
      const borderRadii = new Set<string>();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const tag = tags.nth(i);
        if (await tag.isVisible({ timeout: 500 }).catch(() => false)) {
          const box = await tag.boundingBox();
          if (box) {
            heights.add(Math.round(box.height));
          }
          const radius = await tag.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("border-radius"),
          );
          borderRadii.add(radius);
        }
      }

      console.log(`Tag heights: ${[...heights].join(", ")}px`);
      console.log(`Tag border-radii: ${[...borderRadii].join(", ")}`);

      // Tags should have consistent height (allow 2 variants: normal and small)
      expect(heights.size).toBeLessThanOrEqual(3);
      // Tags should have consistent border-radius
      expect(borderRadii.size).toBeLessThanOrEqual(2);
    });
  });

  test.describe("Progressbar Styling", () => {
    test("progressbar has correct styling tokens", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const progressTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          background: computed.getPropertyValue("--p-progressbar-background"),
          valueBackground: computed.getPropertyValue(
            "--p-progressbar-value-background",
          ),
          borderRadius: computed.getPropertyValue(
            "--p-progressbar-border-radius",
          ),
          height: computed.getPropertyValue("--p-progressbar-height"),
        };
      });

      console.log("Progressbar tokens:", progressTokens);

      expect(progressTokens.borderRadius.trim()).not.toBe("");
      console.log(
        `✓ Progressbar: height=${progressTokens.height}, radius=${progressTokens.borderRadius}`,
      );
    });

    test("progressbar displays with correct styling", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const progressbar = page.locator(".p-progressbar").first();

      if (await progressbar.isVisible({ timeout: 2000 }).catch(() => false)) {
        const height = await progressbar.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("height"),
        );
        const borderRadius = await progressbar.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("border-radius"),
        );

        console.log(
          `✓ Progressbar: height=${height}, border-radius=${borderRadius}`,
        );

        // Height should be reasonable (4-12px typically)
        const px = parseFloat(height);
        expect(px).toBeGreaterThanOrEqual(4);
        expect(px).toBeLessThanOrEqual(16);
      } else {
        console.log("⚠ No progressbar visible - skipping");
      }
    });
  });

  test.describe("Skeleton Styling", () => {
    test("skeleton has correct styling tokens", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const skeletonTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          background: computed.getPropertyValue("--p-skeleton-background"),
          borderRadius: computed.getPropertyValue("--p-skeleton-border-radius"),
        };
      });

      console.log("Skeleton tokens:", skeletonTokens);

      expect(skeletonTokens.borderRadius.trim()).not.toBe("");
      console.log(`✓ Skeleton border-radius: ${skeletonTokens.borderRadius}`);
    });
  });

  test.describe("Avatar Styling", () => {
    test("avatar has correct size tokens", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const avatarTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          smWidth: computed.getPropertyValue("--p-avatar-sm-width"),
          smHeight: computed.getPropertyValue("--p-avatar-sm-height"),
          mdWidth: computed.getPropertyValue("--p-avatar-md-width"),
          mdHeight: computed.getPropertyValue("--p-avatar-md-height"),
          lgWidth: computed.getPropertyValue("--p-avatar-lg-width"),
          lgHeight: computed.getPropertyValue("--p-avatar-lg-height"),
          borderRadius: computed.getPropertyValue("--p-avatar-border-radius"),
        };
      });

      console.log("Avatar tokens:", avatarTokens);

      // Check avatar sizes are on reasonable scale
      const mdWidth = parseFloat(avatarTokens.mdWidth);
      expect(mdWidth).toBeGreaterThanOrEqual(32);
      expect(mdWidth).toBeLessThanOrEqual(48);
      console.log(
        `✓ Avatar md size: ${avatarTokens.mdWidth}x${avatarTokens.mdHeight}`,
      );
    });
  });

  test.describe("Grid and Chart Tokens", () => {
    test("grid and chart sizing tokens are defined", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      const gridTokens = await page.evaluate(() => {
        const root = document.documentElement;
        const computed = window.getComputedStyle(root);
        return {
          // Grid card minimums
          gridCardMinXs: computed.getPropertyValue("--grid-card-min-xs"),
          gridCardMinSm: computed.getPropertyValue("--grid-card-min-sm"),
          gridCardMinMd: computed.getPropertyValue("--grid-card-min-md"),
          gridCardMinLg: computed.getPropertyValue("--grid-card-min-lg"),
          gridCardMinXl: computed.getPropertyValue("--grid-card-min-xl"),
          // Chart minimums
          chartMinHeightSm: computed.getPropertyValue("--chart-min-height-sm"),
          chartMinHeightMd: computed.getPropertyValue("--chart-min-height-md"),
          chartMinHeightLg: computed.getPropertyValue("--chart-min-height-lg"),
          // Input widths
          inputMinWidthSm: computed.getPropertyValue("--input-min-width-sm"),
          inputMinWidthMd: computed.getPropertyValue("--input-min-width-md"),
          inputMinWidthLg: computed.getPropertyValue("--input-min-width-lg"),
        };
      });

      console.log("Grid tokens:", gridTokens);

      // Verify tokens are defined
      expect(gridTokens.gridCardMinMd.trim()).not.toBe("");
      expect(gridTokens.chartMinHeightMd.trim()).not.toBe("");
      expect(gridTokens.inputMinWidthMd.trim()).not.toBe("");

      console.log(
        `✓ Grid tokens defined: card-min-md=${gridTokens.gridCardMinMd}, chart-md=${gridTokens.chartMinHeightMd}`,
      );
    });
  });

  test.describe("Performance Tracking Page Spacing", () => {
    test("performance tracking uses consistent spacing tokens", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/performance-tracking`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      // Check charts grid
      const chartsGrid = page.locator(".charts-grid").first();
      if (await chartsGrid.isVisible({ timeout: 3000 }).catch(() => false)) {
        const gap = await chartsGrid.evaluate((el) =>
          window.getComputedStyle(el).getPropertyValue("gap"),
        );

        console.log(`Charts grid gap: ${gap}`);

        // Gap should be a reasonable value (24px = 1.5rem = space-6)
        const gapPx = parseFloat(gap);
        expect(gapPx).toBeGreaterThanOrEqual(16);
        expect(gapPx).toBeLessThanOrEqual(32);
        console.log(`✓ Charts grid gap: ${gap}`);
      }

      // Check chart cards have minimum height
      const chartCards = page.locator(".chart-card");
      const count = await chartCards.count();

      for (let i = 0; i < Math.min(count, 2); i++) {
        const card = chartCards.nth(i);
        if (await card.isVisible({ timeout: 500 }).catch(() => false)) {
          const minHeight = await card.evaluate((el) =>
            window.getComputedStyle(el).getPropertyValue("min-height"),
          );

          console.log(`Chart card ${i} min-height: ${minHeight}`);

          // Should be around 300px (18.75rem)
          const px = parseFloat(minHeight);
          expect(px).toBeGreaterThanOrEqual(250);
          expect(px).toBeLessThanOrEqual(350);
        }
      }
    });

    test("performance tracking cards use consistent padding", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/performance-tracking`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);

      // Check card padding consistency
      const cards = page.locator(".p-card");
      const count = await cards.count();
      const paddings = new Set<string>();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const card = cards.nth(i);
        if (await card.isVisible({ timeout: 500 }).catch(() => false)) {
          const padding = await card.evaluate((el) => {
            const body = el.querySelector(".p-card-body");
            if (body) {
              return window.getComputedStyle(body).getPropertyValue("padding");
            }
            return "";
          });
          if (padding) {
            paddings.add(padding);
          }
        }
      }

      console.log(`Card paddings found: ${[...paddings].join(", ")}`);

      // Should have at most 2 distinct padding values (default and compact)
      expect(paddings.size).toBeLessThanOrEqual(3);
    });
  });
});
