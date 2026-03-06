/**
 * Quick Smoke Test - Tests all key pages load correctly
 * Faster than full E2E tests, focused on verifying pages render
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:4200";
const TEST_USER = {
  email: process.env["TEST_USER_EMAIL"] || "aljkous@gmail.com",
  password: process.env["TEST_USER_PASSWORD"] || "Futsal12!!!!",
};

// Run tests in parallel for faster execution

async function primeCookieConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const consent = {
      necessary: true,
      analytics: true,
      functional: true,
      consentDate: new Date().toISOString(),
      consentVersion: "1.0",
    };
    localStorage.setItem("flagfit_cookie_consent", JSON.stringify(consent));
  });
}

/**
 * Dismisses the cookie consent banner by setting localStorage consent.
 * This bypasses the banner entirely for testing purposes.
 */
async function dismissCookieBanner(page: Page): Promise<void> {
  // Set cookie consent in localStorage to prevent banner from showing
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

  // Also try to click dismiss if banner is already visible
  try {
    const banner = page.locator("app-cookie-consent-banner");
    if (await banner.isVisible({ timeout: 500 }).catch(() => false)) {
      // Use force click to bypass any overlay issues
      await page
        .locator("app-cookie-consent-banner button")
        .filter({ hasText: /Accept All/i })
        .click({ force: true, timeout: 2000 })
        .catch(() => {});
      // Wait briefly for banner to hide
      await page.waitForTimeout(500);
    }
  } catch {
    // Banner not present or already dismissed
  }
}

test.describe("Quick Smoke Tests", () => {
  test("1. Login and verify session", async ({ page }) => {
    await primeCookieConsent(page);
    await page.goto(`${BASE_URL}/login`);
    await dismissCookieBanner(page);

    // Fill email with proper blur to trigger Angular form validation
    const emailInput = page.locator('input[type="email"]');
    await emailInput.click();
    await emailInput.fill(TEST_USER.email);
    await emailInput.press("Tab");

    // Fill password with proper blur to trigger Angular form validation
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.click();
    await passwordInput.fill(TEST_USER.password);
    await passwordInput.press("Tab");

    // Submit
    await page.waitForSelector('button[type="submit"]:not([disabled])', {
      timeout: 10000,
    });
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
    expect(page.url()).toContain("dashboard");
    console.log("✅ LOGIN: Success - redirected to dashboard");
  });

  test("2. Dashboard loads with content", async ({ page }) => {
    await loginAndNavigate(page, "/dashboard");

    // Check dashboard content
    const hasHeading = await page.locator("h1, h2, h3").first().isVisible();
    expect(hasHeading).toBe(true);
    console.log("✅ DASHBOARD: Page loads with headings");
  });

  test("3. Training Hub loads", async ({ page }) => {
    await loginAndNavigate(page, "/training");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toContain("training");
    console.log("✅ TRAINING: Page loads with training content");
  });

  test("4. Wellness page loads", async ({ page }) => {
    await loginAndNavigate(page, "/wellness");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/wellness|health|check/i);
    console.log("✅ WELLNESS: Page loads");
  });

  test("5. ACWR Dashboard loads", async ({ page }) => {
    await loginAndNavigate(page, "/acwr");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/acwr|load|workload/i);
    console.log("✅ ACWR: Page loads");
  });

  test("6. Analytics page loads", async ({ page }) => {
    await loginAndNavigate(page, "/analytics");

    // Wait longer for Angular to hydrate on analytics page
    await page.waitForTimeout(2000);

    // Check for analytics-specific elements or loading state
    const bodyText = await page.locator("body").textContent();
    const hasAnalyticsContent = bodyText
      ?.toLowerCase()
      .match(/analytics|performance|loading analytics|chart|metric/i);

    // Also check if page has main content area loaded
    const hasMainContent = await page
      .locator("app-analytics, .analytics-page, app-loading, app-page-header")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasAnalyticsContent || hasMainContent).toBeTruthy();
    console.log("✅ ANALYTICS: Page loads");
  });

  test("7. AI Coach Chat loads", async ({ page }) => {
    await loginAndNavigate(page, "/chat");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/chat|message|merlin|coach/i);
    console.log("✅ AI CHAT: Page loads");
  });

  test("8. Settings page loads", async ({ page }) => {
    await loginAndNavigate(page, "/settings");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/settings|profile|preferences/i);
    console.log("✅ SETTINGS: Page loads");
  });

  test("9. Roster page loads", async ({ page }) => {
    await loginAndNavigate(page, "/roster");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/roster|team|player/i);
    console.log("✅ ROSTER: Page loads");
  });

  test("10. Profile page loads", async ({ page }) => {
    await loginAndNavigate(page, "/profile");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/profile|account|user/i);
    console.log("✅ PROFILE: Page loads");
  });

  test("11. Exercise Library loads", async ({ page }) => {
    await loginAndNavigate(page, "/exercise-library");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/exercise|library|workout/i);
    console.log("✅ EXERCISE LIBRARY: Page loads");
  });

  test("12. Game Day Readiness loads", async ({ page }) => {
    await loginAndNavigate(page, "/game/readiness");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/game|readiness|ready/i);
    console.log("✅ GAME READINESS: Page loads");
  });

  test("13. Tournament Nutrition loads", async ({ page }) => {
    await loginAndNavigate(page, "/game/nutrition");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/nutrition|tournament|food/i);
    console.log("✅ NUTRITION: Page loads");
  });

  test("14. Training Videos loads", async ({ page }) => {
    await loginAndNavigate(page, "/training/videos");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/video|training|watch/i);
    console.log("✅ TRAINING VIDEOS: Page loads");
  });

  test("15. Attendance page loads", async ({ page }) => {
    await loginAndNavigate(page, "/attendance");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/attendance|present|absent/i);
    console.log("✅ ATTENDANCE: Page loads");
  });

  test("16. Depth Chart loads", async ({ page }) => {
    await loginAndNavigate(page, "/depth-chart");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/depth|chart|position/i);
    console.log("✅ DEPTH CHART: Page loads");
  });

  test("17. Coach Dashboard loads", async ({ page }) => {
    await loginAndNavigate(page, "/coach/dashboard");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/coach|dashboard|team/i);
    console.log("✅ COACH DASHBOARD: Page loads");
  });

  test("18. Training Schedule loads", async ({ page }) => {
    await loginAndNavigate(page, "/training/schedule");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/schedule|training|session/i);
    console.log("✅ TRAINING SCHEDULE: Page loads");
  });

  test("19. Privacy Settings loads", async ({ page }) => {
    await loginAndNavigate(page, "/settings/privacy");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/privacy|consent|data/i);
    console.log("✅ PRIVACY SETTINGS: Page loads");
  });

  test("20. Community page loads", async ({ page }) => {
    await loginAndNavigate(page, "/community");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.toLowerCase()).toMatch(/community|social|team/i);
    console.log("✅ COMMUNITY: Page loads");
  });
});

// Helper to login and navigate
async function loginAndNavigate(page: Page, path: string) {
  await primeCookieConsent(page);
  await page.goto(`${BASE_URL}/login`);
  await dismissCookieBanner(page);

  // Fill email with proper blur to trigger Angular form validation
  const emailInput = page.locator('input[type="email"]');
  await emailInput.click();
  await emailInput.fill(TEST_USER.email);
  await emailInput.press("Tab");

  // Fill password with proper blur to trigger Angular form validation
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.click();
  await passwordInput.fill(TEST_USER.password);
  await passwordInput.press("Tab");

  // Wait for form validation and button to be enabled
  await page.waitForSelector('button[type="submit"]:not([disabled])', {
    timeout: 10000,
  });
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
  await page.goto(`${BASE_URL}${path}`);
  // Dismiss cookie banner again in case it reappears on new page
  await dismissCookieBanner(page);
  // Wait for Angular to hydrate
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
}
