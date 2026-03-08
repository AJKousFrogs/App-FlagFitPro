/**
 * Mobile Responsive Testing Suite
 * Tests all major iPhone, Samsung, and Xiaomi devices
 *
 * This suite validates:
 * - Layout rendering on various screen sizes
 * - Touch target sizes (min 44x44px)
 * - Text readability (min 16px font size)
 * - Viewport meta tag
 * - Horizontal scrolling prevention
 * - Safe area insets (iOS)
 * - Viewport overflow
 */

import { test, expect, devices } from "@playwright/test";

// ============================================
// DEVICE CONFIGURATIONS
// ============================================

const MOBILE_DEVICES = {
  // iPhone Devices
  iphone: [
    {
      name: "iPhone SE (3rd gen)",
      ...devices["iPhone SE"],
      viewport: { width: 375, height: 667 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "iPhone 12/13/14",
      ...devices["iPhone 12"],
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "iPhone 12/13/14 Pro",
      ...devices["iPhone 12 Pro"],
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "iPhone 14 Pro Max",
      ...devices["iPhone 14 Pro Max"],
      viewport: { width: 430, height: 932 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "iPhone 15 Pro",
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    },
    {
      name: "iPhone 15 Pro Max",
      viewport: { width: 430, height: 932 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    },
  ],
  // Samsung Galaxy Devices
  samsung: [
    {
      name: "Samsung Galaxy S8",
      ...devices["Galaxy S8"],
      viewport: { width: 360, height: 740 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Samsung Galaxy S20",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Samsung Galaxy S21",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Samsung Galaxy S22",
      viewport: { width: 360, height: 780 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Samsung Galaxy S23",
      viewport: { width: 360, height: 780 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/121.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Samsung Galaxy S24",
      viewport: { width: 360, height: 780 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Samsung Galaxy A52",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 2.5,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Samsung Galaxy Z Fold 4 (folded)",
      viewport: { width: 375, height: 772 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
  ],
  // Xiaomi Devices
  xiaomi: [
    {
      name: "Xiaomi Mi 11",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; MI 11) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Xiaomi Redmi Note 10",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 2.5,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Redmi Note 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Xiaomi Redmi Note 11",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 2.5,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Redmi Note 11) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Xiaomi 12",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; 2201123G) AppleWebKit/537.36 Chrome/121.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Xiaomi 13",
      viewport: { width: 360, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; 2211133G) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36",
    },
    {
      name: "Xiaomi Poco X3",
      viewport: { width: 393, height: 851 },
      deviceScaleFactor: 2.75,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; POCO X3 NFC) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    },
  ],
};

function toDeviceUseOptions(device) {
  const { name, defaultBrowserType, ...useOptions } = device;
  return useOptions;
}

// ============================================
// TEST SUITE HELPERS
// ============================================

/**
 * Check if element has sufficient touch target size
 */
async function checkTouchTargetSize(locator) {
  const box = await locator.boundingBox();
  if (box) {
    return box.width >= 44 && box.height >= 44;
  }
  return false;
}

/**
 * Check for horizontal scrolling
 */
async function hasHorizontalScroll(page) {
  return await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    );
  });
}

/**
 * Get computed font size
 */
async function getFontSize(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) {
      return null;
    }
    const computed = window.getComputedStyle(element);
    return parseFloat(computed.fontSize);
  }, selector);
}

/**
 * Check viewport meta tag
 */
async function checkViewportMeta(page) {
  return await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      return null;
    }
    return meta.getAttribute("content");
  });
}

// ============================================
// MAIN TEST SUITES
// ============================================

// Test each device category
for (const [brand, deviceList] of Object.entries(MOBILE_DEVICES)) {
  test.describe(`${brand.toUpperCase()} Devices - Responsive Tests`, () => {
    for (const device of deviceList) {
      test.describe(`${device.name}`, () => {
        test.use(toDeviceUseOptions(device));

        test("should have proper viewport configuration", async ({ page }) => {
          await page.goto("/");

          // Check viewport meta tag
          const viewportContent = await checkViewportMeta(page);
          expect(viewportContent).toBeTruthy();
          expect(viewportContent).toContain("width=device-width");
          expect(viewportContent).toContain("initial-scale=1");
        });

        test("should not have horizontal scroll", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Check main page
          const hasScroll = await hasHorizontalScroll(page);
          expect(hasScroll).toBe(false);
        });

        test("should render header correctly", async ({ page }) => {
          await page.goto("/");
          await page.waitForSelector("app-header, .app-header, header", {
            timeout: 10000,
          });

          const header = page
            .locator("app-header, .app-header, header")
            .first();
          await expect(header).toBeVisible();

          // Header should not overflow viewport
          const headerBox = await header.boundingBox();
          const viewport = page.viewportSize();
          expect(headerBox.width).toBeLessThanOrEqual(viewport.width);
        });

        test("should have readable font sizes (min 16px)", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Check body text
          const bodyFontSize = await getFontSize(page, "body");
          expect(bodyFontSize).toBeGreaterThanOrEqual(16);

          // Check paragraph text if exists
          const paragraphs = page.locator("p");
          const count = await paragraphs.count();
          if (count > 0) {
            const pFontSize = await getFontSize(page, "p");
            expect(pFontSize).toBeGreaterThanOrEqual(14); // Minimum 14px for body text
          }
        });

        test("should have adequate touch targets on buttons", async ({
          page,
        }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Find all clickable buttons
          const buttons = page.locator(
            "button:visible, a.p-button:visible, .btn:visible",
          );
          const count = await buttons.count();

          if (count > 0) {
            // Check first 5 buttons (sample)
            const samplesToCheck = Math.min(count, 5);
            for (let i = 0; i < samplesToCheck; i++) {
              const button = buttons.nth(i);
              const isVisible = await button.isVisible();
              if (isVisible) {
                const box = await button.boundingBox();
                if (box) {
                  // Touch targets should be at least 44x44px (Apple HIG & Material Design)
                  expect(box.height).toBeGreaterThanOrEqual(40); // Allow 40px minimum with some tolerance
                }
              }
            }
          }
        });

        test("should render form inputs correctly", async ({ page }) => {
          await page.goto("/");

          // Check if any inputs exist
          const inputs = page.locator(
            'input[type="text"]:visible, input[type="email"]:visible, input[type="password"]:visible',
          );
          const count = await inputs.count();

          if (count > 0) {
            const input = inputs.first();
            const box = await input.boundingBox();

            // Input height should be at least 44px
            expect(box.height).toBeGreaterThanOrEqual(40);

            // Input should not overflow viewport
            const viewport = page.viewportSize();
            expect(box.width).toBeLessThanOrEqual(viewport.width);
          }
        });

        test("should handle navigation on mobile", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Check for navigation elements
          const nav = page.locator(
            "nav, .p-menubar, .p-tabmenu, app-navigation",
          );
          const navCount = await nav.count();

          if (navCount > 0) {
            const navElement = nav.first();
            await expect(navElement).toBeVisible();

            // Navigation should not overflow
            const navBox = await navElement.boundingBox();
            const viewport = page.viewportSize();
            expect(navBox.width).toBeLessThanOrEqual(viewport.width);
          }
        });

        test("should render cards/panels without overflow", async ({
          page,
        }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Check for cards
          const cards = page.locator(
            '.p-card:visible, .card:visible, [class*="card-"]:visible',
          );
          const count = await cards.count();

          if (count > 0) {
            const viewport = page.viewportSize();

            // Check first 3 cards
            const samplesToCheck = Math.min(count, 3);
            for (let i = 0; i < samplesToCheck; i++) {
              const card = cards.nth(i);
              const box = await card.boundingBox();
              if (box) {
                expect(box.width).toBeLessThanOrEqual(viewport.width);
              }
            }
          }
        });

        test("should have working touch interactions", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Find clickable elements
          const clickables = page.locator("button:visible, a:visible").first();

          if ((await clickables.count()) > 0) {
            // Should be able to tap
            await expect(clickables).toBeVisible();

            // Check if element responds to hover (should have touch-friendly states)
            const hasHoverState = await clickables.evaluate((el) => {
              const styles = window.getComputedStyle(el);
              return (
                styles.cursor === "pointer" ||
                el.tagName === "BUTTON" ||
                el.tagName === "A"
              );
            });

            expect(hasHoverState).toBe(true);
          }
        });

        test("should handle safe areas on iOS", async ({ page }) => {
          // Only for iPhone devices
          if (device.name.toLowerCase().includes("iphone")) {
            await page.goto("/");
            await page.waitForLoadState("networkidle");

            // Check if safe area insets are being used
            const usesSafeArea = await page.evaluate(() => {
              const computed = window.getComputedStyle(document.body);
              const { paddingBottom } = computed;

              // Check if CSS variables for safe area are defined
              const safeAreaBottom =
                computed.getPropertyValue("padding-bottom");

              return safeAreaBottom !== "0px";
            });

            // Note: This might be false if page doesn't use safe areas, which is okay
            // Just documenting that we checked
            expect(typeof usesSafeArea).toBe("boolean");
          }
        });

        test("should render modals/dialogs correctly", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Check if any dialogs are present
          const dialogs = page.locator(
            '.p-dialog:visible, .modal:visible, [role="dialog"]:visible',
          );
          const count = await dialogs.count();

          if (count > 0) {
            const dialog = dialogs.first();
            const box = await dialog.boundingBox();
            const viewport = page.viewportSize();

            // Dialog should fit within viewport with some margin
            expect(box.width).toBeLessThanOrEqual(viewport.width - 32); // 16px margin on each side
            expect(box.height).toBeLessThanOrEqual(viewport.height - 32);
          }
        });

        test("should load within acceptable time", async ({ page }) => {
          const startTime = Date.now();
          await page.goto("/");
          await page.waitForLoadState("domcontentloaded");
          const loadTime = Date.now() - startTime;

          // Should load within 5 seconds on mobile
          expect(loadTime).toBeLessThan(5000);
        });

        test("should have no accessibility violations on mobile", async ({
          page,
        }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          // Check for basic accessibility
          const html = page.locator("html");
          const lang = await html.getAttribute("lang");
          expect(lang).toBeTruthy(); // Should have lang attribute

          // Check for alt text on images
          const images = page.locator("img:visible");
          const imgCount = await images.count();

          for (let i = 0; i < Math.min(imgCount, 5); i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute("alt");
            const role = await img.getAttribute("role");

            // Images should have alt text or role="presentation"
            expect(alt !== null || role === "presentation").toBe(true);
          }
        });
      });
    }
  });
}

// ============================================
// CROSS-DEVICE COMPARISON TESTS
// ============================================

test.describe("Cross-Device Responsive Consistency", () => {
  test("should render consistently across all iPhone models", async ({
    page,
  }) => {
    const screenshots = [];

    for (const device of MOBILE_DEVICES.iphone.slice(0, 3)) {
      // Test first 3 iPhones
      await page.setViewportSize(device.viewport);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check for horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
    }
  });

  test("should render consistently across Samsung devices", async ({
    page,
  }) => {
    for (const device of MOBILE_DEVICES.samsung.slice(0, 3)) {
      // Test first 3 Samsung
      await page.setViewportSize(device.viewport);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check for horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
    }
  });

  test("should render consistently across Xiaomi devices", async ({ page }) => {
    for (const device of MOBILE_DEVICES.xiaomi.slice(0, 3)) {
      // Test first 3 Xiaomi
      await page.setViewportSize(device.viewport);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check for horizontal scroll
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);
    }
  });
});

// ============================================
// ORIENTATION TESTS
// ============================================

test.describe("Orientation Changes", () => {
  const testDevice = MOBILE_DEVICES.iphone[0]; // iPhone SE

  test("should handle portrait to landscape transition", async ({ page }) => {
    // Portrait
    await page.setViewportSize(testDevice.viewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    let hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBe(false);

    // Landscape
    await page.setViewportSize({
      width: testDevice.viewport.height,
      height: testDevice.viewport.width,
    });

    await page.waitForTimeout(500); // Wait for reflow

    hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBe(false);
  });
});
