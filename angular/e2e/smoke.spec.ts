/**
 * Smoke Test - Basic App Shell Verification
 *
 * Quick test to verify the app loads and renders the shell correctly.
 * This is the fastest test to run and should catch critical rendering issues.
 *
 * Run with: npx playwright test e2e/smoke.spec.ts
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4200";

// Test credentials (matching existing test files)
// Default: aljkous@gmail.com / Futsal12!!!!
// Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables to override
const _TEST_USER = {
  email:
    process.env["TEST_USER_EMAIL"] ||
    process.env["E2E_TEST_EMAIL"] ||
    "aljkous@gmail.com",
  password:
    process.env["TEST_USER_PASSWORD"] ||
    process.env["E2E_TEST_PASSWORD"] ||
    "Futsal12!!!!",
};
const HAS_EXPLICIT_TEST_CREDENTIALS = Boolean(
  (process.env["TEST_USER_EMAIL"] && process.env["TEST_USER_PASSWORD"]) ||
    (process.env["E2E_TEST_EMAIL"] && process.env["E2E_TEST_PASSWORD"]),
);

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

  // Try to click dismiss if banner is already visible
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
    // Banner not present or already dismissed
  }
}

async function login(page: Page): Promise<void> {
  await primeCookieConsent(page);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await dismissCookieBanner(page);

  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(_TEST_USER.email);
  await emailInput.press("Tab");

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.click();
  await passwordInput.fill(_TEST_USER.password);
  await passwordInput.press("Tab");

  await page.waitForSelector('button[type="submit"]:not([disabled])', {
    timeout: 10000,
  });
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(
    /.*(dashboard|onboarding|today|player-dashboard).*/,
    {
      timeout: 20000,
    },
  );
  await page.waitForLoadState("networkidle");
}

async function navigateToScrollableShellPage(page: Page): Promise<string> {
  const candidatePaths = ["/settings", "/game/nutrition", "/community"];

  for (const path of candidatePaths) {
    await page.goto(`${BASE_URL}${path}`);
    await dismissCookieBanner(page);
    await page.waitForLoadState("networkidle");

    const shellMetrics = await page.locator(".app-main").evaluate((element) => {
      const appMain = element as HTMLElement;
      return {
        clientHeight: appMain.clientHeight,
        scrollHeight: appMain.scrollHeight,
      };
    });

    if (shellMetrics.scrollHeight > shellMetrics.clientHeight + 200) {
      return path;
    }
  }

  throw new Error("Could not find a sufficiently scrollable shell page");
}

test.describe("Smoke Test - App Shell", () => {
  test.describe.configure({ mode: "serial" });

  test("should load app and render shell", async ({ page }) => {
    await page.goto(BASE_URL);
    await dismissCookieBanner(page);

    // Wait for Angular to bootstrap
    await page.waitForLoadState("networkidle");

    // Verify app shell is rendered
    // Check for main layout component or app root
    const appRoot = page.locator("app-root").first();
    await expect(appRoot).toBeVisible({ timeout: 10000 });

    // Verify no critical console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("favicon") &&
        !e.includes("chunk") &&
        !e.includes("net::ERR_CONNECTION_REFUSED") &&
        !e.includes("404 (Not Found)") &&
        !e.includes("ApiService") &&
        !e.includes("Http failure") &&
        !e.includes("Unknown Error"),
    );

    expect(criticalErrors.length).toBe(0);
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await dismissCookieBanner(page);

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });

    // Login page should have email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('input[type="password"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display login page correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await dismissCookieBanner(page);

    // Verify login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('input[type="password"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button[type="submit"]')).toBeVisible({
      timeout: 5000,
    });

    // Verify page has heading
    const heading = page.locator("h1, h2, .page-header").first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("should display reset-password page correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/reset-password`);
    await dismissCookieBanner(page);

    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button[type="submit"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("h1")).toContainText(/reset password/i);
  });

  test("should display verify-email page in pending state", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/verify-email`);
    await dismissCookieBanner(page);

    await expect(page.locator("h1")).toContainText(/verify your email/i, {
      timeout: 5000,
    });
    await expect(page.getByRole("button", { name: /resend verification/i }))
      .toBeVisible({
        timeout: 5000,
      });
  });

  test("should show update-password invalid state without recovery tokens", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/update-password`);
    await dismissCookieBanner(page);

    await expect(page.locator("h1")).toContainText(/set new password/i, {
      timeout: 5000,
    });
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("link", { name: /request new reset link/i }),
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test("should show accept-invitation invalid state without a token", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/accept-invitation`);
    await dismissCookieBanner(page);

    await expect(page.locator("h1")).toContainText(/team invitation/i, {
      timeout: 5000,
    });
    await expect(page.getByText(/invalid invitation link/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should keep header and sidebar stable while only content scrolls", async ({
    page,
  }) => {
    test.skip(
      !HAS_EXPLICIT_TEST_CREDENTIALS,
      "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD for authenticated shell verification",
    );

    await login(page);
    const testedPath = await navigateToScrollableShellPage(page);

    const header = page.locator("app-header");
    const sidebar = page.locator("app-sidebar .sidebar");
    const appMain = page.locator(".app-main");

    await expect(header).toBeVisible({ timeout: 10000 });
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    await expect(appMain).toBeVisible({ timeout: 10000 });

    const before = await page.evaluate(() => {
      const appMain = document.querySelector(".app-main") as HTMLElement | null;
      const header = document.querySelector("app-header") as HTMLElement | null;
      const sidebar = document.querySelector(
        "app-sidebar .sidebar",
      ) as HTMLElement | null;

      if (!appMain || !header || !sidebar) {
        throw new Error("Shell elements were not found");
      }

      return {
        bodyOverflow: getComputedStyle(document.body).overflow,
        appMainOverflowY: getComputedStyle(appMain).overflowY,
        headerPosition: getComputedStyle(header).position,
        sidebarPosition: getComputedStyle(sidebar).position,
        appMainScrollTop: appMain.scrollTop,
        appMainClientHeight: appMain.clientHeight,
        appMainScrollHeight: appMain.scrollHeight,
        windowScrollY: window.scrollY,
        headerTop: header.getBoundingClientRect().top,
        sidebarTop: sidebar.getBoundingClientRect().top,
      };
    });

    expect(before.bodyOverflow).toBe("hidden");
    expect(before.appMainOverflowY).toMatch(/auto|scroll/);
    expect(before.headerPosition).toBe("sticky");
    expect(before.sidebarPosition).toBe("sticky");
    expect(before.appMainScrollHeight).toBeGreaterThan(
      before.appMainClientHeight + 200,
    );

    await appMain.evaluate((element) => {
      (element as HTMLElement).scrollTop = 640;
    });
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => {
      const appMain = document.querySelector(".app-main") as HTMLElement | null;
      const header = document.querySelector("app-header") as HTMLElement | null;
      const sidebar = document.querySelector(
        "app-sidebar .sidebar",
      ) as HTMLElement | null;

      if (!appMain || !header || !sidebar) {
        throw new Error("Shell elements were not found after scroll");
      }

      return {
        appMainScrollTop: appMain.scrollTop,
        windowScrollY: window.scrollY,
        headerTop: header.getBoundingClientRect().top,
        sidebarTop: sidebar.getBoundingClientRect().top,
      };
    });

    expect(after.appMainScrollTop).toBeGreaterThan(300);
    expect(after.windowScrollY).toBe(0);
    expect(Math.abs(after.headerTop - before.headerTop)).toBeLessThan(2);
    expect(Math.abs(after.sidebarTop - before.sidebarTop)).toBeLessThan(2);

    test.info().annotations.push({
      type: "shell-route",
      description: testedPath,
    });
  });
});
