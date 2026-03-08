import { expect, test, type Page } from "@playwright/test";

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
  await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });
}

test.describe("Training Tool Routes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("goal planner, microcycle, and load analysis routes load for the current athlete", async ({
    page,
  }) => {
    const routes = [
      {
        path: "/training/goal-planner",
        heading: /goal-based training planner/i,
      },
      {
        path: "/training/microcycle",
        heading: /weekly microcycle planner/i,
      },
      {
        path: "/training/load-analysis",
        heading: /acwr analysis|training load data|4-week flag football metrics/i,
      },
    ];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route.path}`);
      await dismissCookieBanner(page);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, "\\/")));
      await expect(
        page.locator("h1, h2, h3").filter({ hasText: route.heading }).first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
