/**
 * Visual Regression Tests for FlagFit Components
 *
 * Uses Playwright's screenshot comparison to catch UI regressions
 * from Sass deprecation cleanups, duplicate removal, and style refactors.
 *
 * Run with: npx playwright test visual-regression
 * Update baselines: npx playwright test visual-regression --update-snapshots
 *
 * NOTE: Storybook component tests are currently skipped due to
 * Storybook 10 + @storybook/test-runner incompatibility (MissingStoryFromCsfFileError).
 * Use app page screenshots until @storybook/test@10.x is released.
 *
 * @version 1.0.0
 */

import { test, expect, Page } from "@playwright/test";

const STORYBOOK_URL = process.env["STORYBOOK_URL"] || "http://localhost:6006";
const APP_URL = process.env["BASE_URL"] || "http://localhost:4200";

// Test credentials for app screenshots
const TEST_USER = {
  email: process.env["TEST_USER_EMAIL"] || "aljkous@gmail.com",
  password: process.env["TEST_USER_PASSWORD"] || "Futsal12!!!!",
};

/**
 * Wait for Storybook story to fully render and check for errors
 */
async function waitForStorybook(page: Page): Promise<boolean> {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  // Check if story rendered or has error
  const hasError = await page
    .locator('text="Couldn\'t find story"')
    .isVisible({ timeout: 1000 })
    .catch(() => false);

  if (hasError) {
    return false;
  }

  await page.waitForTimeout(500);
  return true;
}

/**
 * Login helper for app screenshots
 */
async function loginToApp(page: Page): Promise<void> {
  await page.goto(`${APP_URL}/login`);

  // Dismiss cookie banner
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

  await page.reload();
  await page.waitForLoadState("networkidle");

  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(TEST_USER.email);

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(TEST_USER.password);

  await page.click('button[type="submit"]');
  await page.waitForURL(/.*(dashboard|onboarding).*/, { timeout: 15000 });
}

/**
 * Dismiss cookie banner helper
 * Note: This must be called AFTER navigating to a page
 */
async function dismissCookieBanner(page: Page): Promise<void> {
  try {
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
  } catch {
    // localStorage may not be available yet - that's OK, we'll handle the banner manually
  }
}

/**
 * Mask all dynamic content that changes between test runs
 * This hides timestamps, dates, relative times, counters, etc.
 */
async function maskDynamicContent(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Selectors for dynamic content that changes between runs
    const dynamicSelectors = [
      // Timestamps and dates
      '[data-testid="timestamp"]',
      '.timestamp',
      'time',
      '.date',
      '[class*="time"]',
      '[class*="date"]',
      '[class*="ago"]',
      '.relative-time',
      '.last-updated',
      '.updated-at',
      // Counters and live data
      '.streak-count',
      '.session-count',
      '[class*="count"]',
      '[class*="streak"]',
      // Chart tooltips and dynamic badges
      '.chart-tooltip',
      '.p-tooltip',
      // Notifications badges with counts
      '.notification-badge',
      '.badge-count',
      // Loading spinners that might be visible
      '.p-progressspinner',
      '.loading-indicator',
    ];

    document.querySelectorAll(dynamicSelectors.join(', ')).forEach((el) => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
  });
}

// ============================================================================
// STORYBOOK COMPONENT TESTS - SKIPPED UNTIL @storybook/test@10.x
// ============================================================================
// These tests are skipped due to Storybook 10 CSF loading bug
// Uncomment when @storybook/test@10.x is released

test.describe.skip("Storybook Components (blocked by SB10 bug)", () => {
  test("Button - Primary variant unchanged", async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=design-system-button--primary&viewMode=story`
    );
    const ready = await waitForStorybook(page);
    test.skip(!ready, "Story not rendering due to Storybook 10 bug");

    const storyRoot = page.locator("#storybook-root");
    await expect(storyRoot).toHaveScreenshot("button-primary.png", {
      maxDiffPixels: 50,
    });
  });

  test("Empty State - Default unchanged", async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=components-emptystate--default&viewMode=story`
    );
    const ready = await waitForStorybook(page);
    test.skip(!ready, "Story not rendering due to Storybook 10 bug");

    const storyRoot = page.locator("#storybook-root");
    await expect(storyRoot).toHaveScreenshot("empty-state-default.png", {
      maxDiffPixels: 50,
    });
  });
});

// ============================================================================
// APP PAGE VISUAL REGRESSION TESTS - PRIMARY WORKAROUND
// ============================================================================
// These tests capture full page screenshots to detect UI regressions

test.describe("App Page Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app first, then handle localStorage
    await loginToApp(page);

    // Handle onboarding if present
    if (page.url().includes("onboarding")) {
      await page.goto(`${APP_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
    }
    
    // Now dismiss cookie banner after we're on a real page
    await dismissCookieBanner(page);
  });

  test("Dashboard layout unchanged", async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Mask all dynamic content
    await maskDynamicContent(page);

    await expect(page).toHaveScreenshot("dashboard-layout.png", {
      maxDiffPixels: 2000, // Allow ~2% variance for dynamic data and minor rendering differences
      fullPage: false,
    });
  });

  test("Training page layout unchanged", async ({ page }) => {
    await page.goto(`${APP_URL}/training`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Mask all dynamic content
    await maskDynamicContent(page);

    await expect(page).toHaveScreenshot("training-layout.png", {
      maxDiffPixels: 2000, // Allow for dynamic session data
      fullPage: false,
    });
  });

  test("Wellness page layout unchanged", async ({ page }) => {
    await page.goto(`${APP_URL}/wellness`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Mask all dynamic content
    await maskDynamicContent(page);

    await expect(page).toHaveScreenshot("wellness-layout.png", {
      maxDiffPixels: 20000, // Wellness page has many dynamic charts and scores
      fullPage: false,
    });
  });

  test("Today's Practice page layout unchanged", async ({ page }) => {
    await page.goto(`${APP_URL}/todays-practice`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Mask all dynamic content
    await maskDynamicContent(page);

    await expect(page).toHaveScreenshot("todays-practice-layout.png", {
      maxDiffPixels: 2000,
      fullPage: false,
    });
  });

  test("ACWR page layout unchanged", async ({ page }) => {
    await page.goto(`${APP_URL}/acwr`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Mask all dynamic content
    await maskDynamicContent(page);

    await expect(page).toHaveScreenshot("acwr-layout.png", {
      maxDiffPixels: 2000,
      fullPage: false,
    });
  });
});

// ============================================================================
// COMPONENT ELEMENT SCREENSHOTS - IN-APP CAPTURE
// ============================================================================
// Capture specific component elements within app pages

test.describe("Component Element Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app first, then handle localStorage
    await loginToApp(page);

    if (page.url().includes("onboarding")) {
      await page.goto(`${APP_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
    }
    
    // Now dismiss cookie banner after we're on a real page
    await dismissCookieBanner(page);
  });

  test.skip("PrimeNG Cards styling", async ({ page }) => {
    // SKIPPED: Card height varies based on dynamic content (wellness status, checkin streak, etc.)
    // This test is unreliable for visual regression. Use page-level screenshots instead.
    await page.goto(`${APP_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Mask all dynamic content
    await maskDynamicContent(page);

    // Also hide welcome card personalized content (user name, greeting)
    await page.evaluate(() => {
      document.querySelectorAll('.welcome-card h2, .welcome-card h3, .greeting, [class*="welcome"]').forEach((el) => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    });

    // Capture first card on dashboard (skip cards with highly dynamic content)
    const card = page.locator("p-card:not(.missing-data-card):not(.welcome-card), .p-card:not(.missing-data-card):not(.welcome-card)").first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(card).toHaveScreenshot("primeng-card.png", {
        maxDiffPixels: 5000, // Allow for dynamic content within card
      });
    } else {
      // Fallback: if no suitable card found, just check any card exists
      test.skip(true, "No suitable card found for screenshot");
    }
  });

  test("Button styling in context", async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Capture a primary button
    const primaryButton = page
      .locator("button.p-button, app-button")
      .first();
    if (await primaryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(primaryButton).toHaveScreenshot("button-in-context.png", {
        maxDiffPixels: 100, // Allow for minor rendering variations
      });
    }
  });

  test("Navigation styling", async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Capture navigation/sidebar
    const nav = page.locator("nav, .sidebar, .p-menubar").first();
    if (await nav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(nav).toHaveScreenshot("navigation.png", {
        maxDiffPixels: 100,
      });
    }
  });
});
