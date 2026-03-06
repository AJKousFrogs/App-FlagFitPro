/**
 * PrimeNG Button Geometry Smoke Test
 *
 * Verifies PrimeNG buttons use consistent geometry from shared tokens.
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4200";
const TEST_USER = {
  email: process.env["TEST_USER_EMAIL"] || "aljkous@gmail.com",
  password: process.env["TEST_USER_PASSWORD"] || "Futsal12!!!!",
};

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

async function login(page: Page): Promise<void> {
  await primeCookieConsent(page);
  await page.goto(`${BASE_URL}/login`);
  await dismissCookieBanner(page);

  const emailInput = page.locator('input[type="email"]');
  await emailInput.click();
  await emailInput.fill(TEST_USER.email);
  await emailInput.press("Tab");

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.click();
  await passwordInput.fill(TEST_USER.password);
  await passwordInput.press("Tab");

  await page.waitForSelector('button[type="submit"]:not([disabled])', {
    timeout: 10000,
  });
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*(dashboard|onboarding).*/, { timeout: 15000 });
}

test.describe("PrimeNG Button Geometry", () => {
  test("uses consistent padding, radius, and min-height", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");

    const button = page.locator("button.p-button").first();
    await expect(button).toBeVisible();

    const styles = await button.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,
        minHeight: computed.minHeight,
      };
    });

    expect(parseFloat(styles.borderRadius)).toBeGreaterThanOrEqual(8);
    expect(parseFloat(styles.paddingLeft)).toBeGreaterThanOrEqual(12);
    expect(parseFloat(styles.paddingRight)).toBeGreaterThanOrEqual(12);
    expect(parseFloat(styles.minHeight)).toBeGreaterThanOrEqual(40);
  });
});
