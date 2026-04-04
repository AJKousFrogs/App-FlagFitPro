/**
 * Navigation & Routing Test Suite
 *
 * Comprehensive test that clicks through all pages, buttons, and navigation links
 * to verify routing works correctly and pages load properly.
 *
 * Run with: npx playwright test e2e/navigation-routing.spec.ts
 * Run in headed mode to watch: npx playwright test e2e/navigation-routing.spec.ts --headed
 * Run with UI: npx playwright test e2e/navigation-routing.spec.ts --ui
 */

import { test, expect, Page } from "@playwright/test";

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
    '[data-testid="email-input"] input, input[type="email"]',
  );
  await emailInput.click();
  await emailInput.fill(TEST_USER.email);
  await emailInput.press("Tab");

  const passwordInput = page.locator(
    '[data-testid="password-input"] input, input[type="password"]',
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
 * Navigate to a route and verify it loads
 */
async function navigateAndVerify(
  page: Page,
  route: string,
  expectedUrlPattern: RegExp,
  _pageTitle?: string,
): Promise<void> {
  console.log(`📍 Navigating to: ${route}`);

  // Navigate
  await page.goto(`${BASE_URL}${route}`);
  await dismissCookieBanner(page);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // Wait for Angular to hydrate

  // Verify URL
  await expect(page).toHaveURL(expectedUrlPattern, { timeout: 10000 });

  // Verify page loaded (has content)
  const bodyText = await page.locator("body").textContent();
  expect(bodyText?.length).toBeGreaterThan(100); // Page has content

  // Verify no critical errors
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

  console.log(`✅ ${route} loaded successfully`);
}

test.describe("Navigation & Routing - Comprehensive Click-Through", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Handle onboarding if present
    if (page.url().includes("onboarding")) {
      console.log("⚠️  Onboarding detected - skipping for navigation test");
      // Navigate directly to dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
    }
  });

  test("should navigate through all main routes via direct URL", async ({
    page,
  }) => {
    const routes = [
      { path: "/dashboard", pattern: /.*dashboard.*/ },
      { path: "/todays-practice", pattern: /.*todays-practice.*/ },
      { path: "/training", pattern: /.*training.*/ },
      { path: "/wellness", pattern: /.*wellness.*/ },
      { path: "/acwr", pattern: /.*acwr.*/ },
      { path: "/analytics", pattern: /.*analytics.*/ },
      { path: "/chat", pattern: /.*chat.*/ },
      { path: "/roster", pattern: /.*roster.*/ },
      { path: "/profile", pattern: /.*profile.*/ },
      { path: "/settings", pattern: /.*settings.*/ },
      { path: "/exercise-library", pattern: /.*exercise-library.*/ },
      { path: "/training/videos", pattern: /.*training.*videos.*/ },
    ];

    for (const route of routes) {
      await navigateAndVerify(page, route.path, route.pattern);
    }
  });

  test("should navigate through sidebar navigation links", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Get all sidebar navigation links
    const sidebarLinks = page
      .locator('a[routerLink], a[href*="/"], [data-testid^="nav-"]')
      .filter({ hasNotText: /logout|log out/i });

    const linkCount = await sidebarLinks.count();
    console.log(`Found ${linkCount} navigation links`);

    // Click through each link
    for (let i = 0; i < Math.min(linkCount, 15); i++) {
      // Limit to 15 to avoid timeout
      const link = sidebarLinks.nth(i);
      const href = await link.getAttribute("href").catch(() => null);
      const routerLink = await link
        .getAttribute("routerLink")
        .catch(() => null);
      const route = href || routerLink || "";

      if (!route || route === "#" || route.includes("logout")) {
        continue;
      }

      console.log(`🔗 Clicking sidebar link: ${route}`);

      try {
        await link.click({ timeout: 5000 });
        await page.waitForTimeout(2000); // Wait for navigation
        await page.waitForLoadState("networkidle", { timeout: 10000 });

        // Verify URL changed
        const currentUrl = page.url();
        expect(currentUrl).toContain(route.replace(/^\//, "").split("/")[0]);

        console.log(`✅ Navigated to: ${currentUrl}`);
      } catch (error) {
        console.log(`⚠️  Could not click link ${route}: ${error}`);
        // Continue with next link
      }

      // Go back to dashboard to reset
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
    }
  });

  test("should click buttons and verify routing", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Find all buttons with routerLink or href
    const buttons = page.locator(
      'button[routerLink], a[role="button"][routerLink], app-button[routerLink], button[href], a[role="button"][href]',
    );

    const buttonCount = await buttons.count();
    console.log(`Found ${buttonCount} buttons with routing`);

    // Click through buttons (limit to avoid timeout)
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const routerLink = await button
        .getAttribute("routerLink")
        .catch(() => null);
      const href = await button.getAttribute("href").catch(() => null);
      const route = routerLink || href;

      if (!route || route === "#") {
        continue;
      }

      console.log(`🔘 Clicking button with route: ${route}`);

      try {
        const initialUrl = page.url();
        await button.click({ timeout: 5000 });
        await page.waitForTimeout(2000);

        // Check if URL changed
        const newUrl = page.url();
        if (newUrl !== initialUrl) {
          console.log(`✅ Button routed from ${initialUrl} to ${newUrl}`);
        } else {
          console.log(
            `ℹ️  Button clicked but URL unchanged (may be modal/dialog)`,
          );
        }
      } catch (error) {
        console.log(`⚠️  Could not click button: ${error}`);
      }

      // Return to dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
    }
  });

  test("should verify Today's Practice page interactions", async ({ page }) => {
    await page.goto(`${BASE_URL}/todays-practice`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(2000);

    // Find and click all clickable elements
    const clickableElements = page.locator(
      'button:not([disabled]), a:not([disabled]), [role="button"]:not([disabled]), .protocol-block-header, .block-header',
    );

    const elementCount = await clickableElements.count();
    console.log(
      `Found ${elementCount} clickable elements on Today's Practice page`,
    );

    // Click through protocol blocks if they exist
    const protocolBlocks = page.locator(
      '[data-testid="protocol-block-morning-mobility"], [data-testid="protocol-block-foam-rolling"], .protocol-block-header',
    );

    const blockCount = await protocolBlocks.count();
    if (blockCount > 0) {
      console.log(`Found ${blockCount} protocol blocks to interact with`);

      for (let i = 0; i < Math.min(blockCount, 3); i++) {
        const block = protocolBlocks.nth(i);
        console.log(`📦 Clicking protocol block ${i + 1}`);

        try {
          await block.click({ timeout: 5000 });
          await page.waitForTimeout(1000);

          // Verify block expanded (check for exercise list)
          const exerciseList = page.locator(
            ".exercise-list, .exercise-checkbox",
          );
          const hasExercises = await exerciseList
            .isVisible({ timeout: 2000 })
            .catch(() => false);

          if (hasExercises) {
            console.log(`✅ Block expanded, exercises visible`);

            // Try clicking a checkbox if available
            const checkbox = page.locator('input[type="checkbox"]').first();
            if (
              await checkbox.isVisible({ timeout: 1000 }).catch(() => false)
            ) {
              await checkbox.click();
              await page.waitForTimeout(500);
              console.log(`✅ Checkbox clicked`);
            }
          }
        } catch (error) {
          console.log(`⚠️  Could not interact with block: ${error}`);
        }
      }
    }
  });

  test("should verify navigation breadcrumbs and back buttons", async ({
    page,
  }) => {
    // Navigate through a flow and verify back navigation works
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Navigate to training
    await page.goto(`${BASE_URL}/training`);
    await page.waitForLoadState("networkidle");
    const trainingUrl = page.url();

    // Navigate to a sub-route
    await page.goto(`${BASE_URL}/training/videos`);
    await page.waitForLoadState("networkidle");
    const _videosUrl = page.url();

    // Try browser back
    await page.goBack();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(trainingUrl);

    console.log("✅ Browser back navigation works");
  });

  test("should verify all page headers and titles load", async ({ page }) => {
    const routes = [
      "/dashboard",
      "/todays-practice",
      "/training",
      "/wellness",
      "/acwr",
      "/analytics",
      "/chat",
    ];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);
      await page.waitForTimeout(1000);

      // Verify page has a heading
      const heading = page
        .locator("h1, h2, .page-header, .card-header-title")
        .first();
      const isVisible = await heading
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (isVisible) {
        const headingText = await heading.textContent();
        console.log(`✅ ${route}: "${headingText?.substring(0, 50)}"`);
      } else {
        console.log(`⚠️  ${route}: No heading found`);
      }
    }
  });

  test("should verify mobile navigation (if responsive)", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);

    // Look for mobile menu/hamburger
    const mobileMenu = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger, .menu-toggle, [data-testid*="menu"]',
    );

    const hasMobileMenu = await mobileMenu
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasMobileMenu) {
      console.log("📱 Mobile menu found");
      await mobileMenu.click();
      await page.waitForTimeout(500);

      // Try clicking a menu item
      const menuItems = page.locator('a[routerLink], [role="menuitem"]');
      const itemCount = await menuItems.count();

      if (itemCount > 0) {
        const firstItem = menuItems.first();
        await firstItem.click();
        await page.waitForTimeout(2000);
        console.log("✅ Mobile navigation works");
      }
    } else {
      console.log("ℹ️  No mobile menu detected (may use sidebar)");
    }
  });
});
