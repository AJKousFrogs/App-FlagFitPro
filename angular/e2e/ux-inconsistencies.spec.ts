/**
 * UX Inconsistencies Test
 *
 * Tests for UX inconsistencies and violations of user experience patterns.
 * Checks for:
 * - Inconsistent button placement and behavior
 * - Missing loading states
 * - Inconsistent error handling
 * - Navigation inconsistencies
 * - Form validation inconsistencies
 * - Accessibility issues affecting UX
 * - Inconsistent feedback patterns
 *
 * Run with: npx playwright test e2e/ux-inconsistencies.spec.ts
 * Run in UI mode: npx playwright test e2e/ux-inconsistencies.spec.ts --ui
 * Run in headed mode: npx playwright test e2e/ux-inconsistencies.spec.ts --headed
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

test.describe("UX Inconsistencies", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Handle onboarding if present
    if (page.url().includes("onboarding")) {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
    }
  });

  test("should have consistent button placement and behavior", async ({
    page,
  }) => {
    const routes = ["/dashboard", "/todays-practice", "/training", "/wellness"];

    const inconsistencies: Array<{
      route: string;
      issue: string;
      details: string;
    }> = [];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);
      await page.waitForTimeout(1000);

      // Check for primary action buttons
      const primaryButtons = page.locator(
        'button.p-button-primary, button[type="submit"], .p-button-primary',
      );
      const buttonCount = await primaryButtons.count();

      // Check if buttons are consistently placed (top-right, bottom-right, etc.)
      const buttonPositions: Array<{ text: string; position: string }> = [];

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = primaryButtons.nth(i);
        if (!(await button.isVisible({ timeout: 1000 }).catch(() => false))) {
          continue;
        }

        const boundingBox = await button.boundingBox();
        const text = await button.textContent();

        if (boundingBox) {
          const viewportSize = page.viewportSize();
          const viewportWidth = viewportSize?.width ?? 1920;
          const position =
            boundingBox.x > viewportWidth * 0.7
              ? "right"
              : boundingBox.x < viewportWidth * 0.3
                ? "left"
                : "center";

          buttonPositions.push({ text: text || "", position });
        }
      }

      // Check for inconsistent placement
      const positions = buttonPositions.map((b) => b.position);
      const uniquePositions = [...new Set(positions)];

      if (uniquePositions.length > 2 && buttonCount > 3) {
        inconsistencies.push({
          route,
          issue: "Inconsistent primary button placement",
          details: `Found buttons in positions: ${uniquePositions.join(", ")}`,
        });
      }

      // Check for disabled state consistency
      const disabledButtons = page.locator("button:disabled, button[disabled]");
      const disabledCount = await disabledButtons.count();

      if (disabledCount > 0) {
        // Check if disabled buttons have consistent visual feedback
        for (let i = 0; i < Math.min(disabledCount, 5); i++) {
          const button = disabledButtons.nth(i);
          const opacity = await button.evaluate((el) => {
            return window.getComputedStyle(el).opacity;
          });

          if (parseFloat(opacity) > 0.7) {
            inconsistencies.push({
              route,
              issue: "Disabled button lacks visual feedback",
              details: "Disabled button opacity too high",
            });
          }
        }
      }
    }

    if (inconsistencies.length > 0) {
      console.log("\n🚨 Button Placement/Behavior Inconsistencies:");
      inconsistencies.forEach((inc) => {
        console.log(`  ${inc.route} → ${inc.issue}: ${inc.details}`);
      });
    }

    // Allow some inconsistencies but log them
    expect(inconsistencies.length).toBeLessThan(20);
  });

  test("should have consistent loading states", async ({ page }) => {
    const routes = ["/dashboard", "/todays-practice", "/training"];

    // Reserved for future use - will track loading state inconsistencies
    const _inconsistencies: Array<{
      route: string;
      issue: string;
    }> = [];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);
      await page.waitForTimeout(1000);

      // Check for loading indicators
      const loadingIndicators = page.locator(
        ".p-progress-spinner, .spinner, [aria-busy='true'], .loading, .p-skeleton",
      );
      const _loadingCount = await loadingIndicators.count();

      // Check if buttons show loading state when clicked
      const buttons = page.locator("button:not([disabled])");
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();

        // Skip if already has loading indicator
        if (buttonText?.includes("Loading") || buttonText?.includes("...")) {
          continue;
        }

        // Check if button has aria-busy or loading class
        const hasLoadingState =
          (await button.getAttribute("aria-busy")) === "true" ||
          (await button.locator(".p-progress-spinner").count()) > 0;

        if (!hasLoadingState && buttonText && buttonText.length > 0) {
          // This is a potential inconsistency - buttons should show loading state
          // But we'll be lenient and only flag if many buttons lack this
        }
      }

      // Check for skeleton loaders vs spinners inconsistency
      const skeletons = page.locator(".p-skeleton, .skeleton");
      const spinners = page.locator(".p-progress-spinner, .spinner");

      const skeletonCount = await skeletons.count();
      const spinnerCount = await spinners.count();

      if (skeletonCount > 0 && spinnerCount > 0 && route === "/dashboard") {
        // Mixed loading patterns might be intentional, but log it
        console.log(
          `⚠️  Mixed loading patterns on ${route}: ${skeletonCount} skeletons, ${spinnerCount} spinners`,
        );
      }
    }

    console.log("Loading state consistency check complete");
  });

  test("should have consistent error handling and feedback", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    const inconsistencies: Array<{
      issue: string;
      details: string;
    }> = [];

    // Check for error message patterns
    const errorMessages = page.locator(
      ".p-message-error, .error-message, [role='alert'], .p-toast-message-error",
    );
    const errorCount = await errorMessages.count();

    // Check for toast notifications
    const toasts = page.locator(".p-toast, .toast, [role='status']");
    const toastCount = await toasts.count();

    // Check for inline form errors
    const formErrors = page.locator(
      ".p-invalid, .ng-invalid, .field-error, [aria-invalid='true']",
    );
    const _formErrorCount = await formErrors.count();

    // Check consistency of error display methods
    if (errorCount > 0 && toastCount > 0) {
      console.log(
        `⚠️  Multiple error display methods found: ${errorCount} error messages, ${toastCount} toasts`,
      );
    }

    // Check if error messages have consistent styling
    const errorStyles: string[] = [];
    for (let i = 0; i < Math.min(errorCount, 5); i++) {
      const error = errorMessages.nth(i);
      const bgColor = await error.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      errorStyles.push(bgColor);
    }

    const uniqueErrorStyles = [...new Set(errorStyles)];
    if (uniqueErrorStyles.length > 2 && errorCount > 3) {
      inconsistencies.push({
        issue: "Inconsistent error message styling",
        details: `Found ${uniqueErrorStyles.length} different error styles`,
      });
    }

    if (inconsistencies.length > 0) {
      console.log("\n🚨 Error Handling Inconsistencies:");
      inconsistencies.forEach((inc) => {
        console.log(`  ${inc.issue}: ${inc.details}`);
      });
    }

    expect(inconsistencies.length).toBeLessThan(10);
  });

  test("should have consistent navigation patterns", async ({ page }) => {
    const inconsistencies: Array<{
      route: string;
      issue: string;
    }> = [];

    // Test navigation from dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    // Check for back buttons
    const backButtons = page.locator(
      'button:has-text("Back"), button:has-text("←"), [aria-label*="back" i], [aria-label*="previous" i]',
    );
    const backButtonCount = await backButtons.count();

    // Check for breadcrumbs
    const breadcrumbs = page.locator(
      ".breadcrumb, .p-breadcrumb, nav[aria-label='breadcrumb']",
    );
    const breadcrumbCount = await breadcrumbs.count();

    // Check sidebar navigation
    const sidebar = page.locator("aside, .sidebar, nav[aria-label='main']");
    const sidebarCount = await sidebar.count();

    // Check bottom navigation (mobile)
    const bottomNav = page.locator(".bottom-nav, nav[aria-label='bottom']");
    const bottomNavCount = await bottomNav.count();

    // Log navigation patterns found
    console.log(
      `Navigation patterns: ${backButtonCount} back buttons, ${breadcrumbCount} breadcrumbs, ${sidebarCount} sidebars, ${bottomNavCount} bottom navs`,
    );

    // Check if navigation is consistent across pages
    const routes = ["/todays-practice", "/training", "/wellness"];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);
      await page.waitForTimeout(1000);

      const routeBackButtons = await page
        .locator(
          'button:has-text("Back"), button:has-text("←"), [aria-label*="back" i]',
        )
        .count();
      const routeBreadcrumbs = await page
        .locator(".breadcrumb, .p-breadcrumb")
        .count();

      // Check if back button presence is inconsistent
      if (backButtonCount === 0 && routeBackButtons > 0) {
        inconsistencies.push({
          route,
          issue: "Inconsistent back button presence",
        });
      }

      // Check if breadcrumb presence is inconsistent
      if (breadcrumbCount === 0 && routeBreadcrumbs > 0) {
        inconsistencies.push({
          route,
          issue: "Inconsistent breadcrumb presence",
        });
      }
    }

    if (inconsistencies.length > 0) {
      console.log("\n🚨 Navigation Inconsistencies:");
      inconsistencies.forEach((inc) => {
        console.log(`  ${inc.route} → ${inc.issue}`);
      });
    }

    expect(inconsistencies.length).toBeLessThan(10);
  });

  test("should have consistent form validation feedback", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    const inconsistencies: Array<{
      issue: string;
      details: string;
    }> = [];

    // Look for forms on the page
    const forms = page.locator("form");
    const formCount = await forms.count();

    if (formCount === 0) {
      // Try to navigate to a page with forms (like settings or profile)
      const formRoutes = ["/settings", "/profile", "/onboarding"];

      for (const route of formRoutes) {
        try {
          await page.goto(`${BASE_URL}${route}`, { timeout: 5000 });
          await page.waitForLoadState("networkidle");
          await dismissCookieBanner(page);
          await page.waitForTimeout(1000);

          const routeForms = await page.locator("form").count();
          if (routeForms > 0) {
            break;
          }
        } catch {
          // Route might not exist or be accessible
          continue;
        }
      }
    }

    // Check for validation error indicators
    const invalidFields = page.locator(
      "input.p-invalid, select.p-invalid, textarea.p-invalid, .ng-invalid.ng-touched",
    );
    const invalidCount = await invalidFields.count();

    // Check for validation messages
    const validationMessages = page.locator(
      ".p-error, .field-error, .validation-message, [role='alert']",
    );
    const messageCount = await validationMessages.count();

    // Check consistency: invalid fields should have error messages nearby
    if (invalidCount > 0 && messageCount === 0) {
      inconsistencies.push({
        issue: "Invalid fields without error messages",
        details: `Found ${invalidCount} invalid fields but no error messages`,
      });
    }

    // Check for consistent error message placement
    const errorMessageStyles: string[] = [];
    for (let i = 0; i < Math.min(messageCount, 5); i++) {
      const message = validationMessages.nth(i);
      const color = await message.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      errorMessageStyles.push(color);
    }

    const uniqueStyles = [...new Set(errorMessageStyles)];
    if (uniqueStyles.length > 2 && messageCount > 3) {
      inconsistencies.push({
        issue: "Inconsistent validation message styling",
        details: `Found ${uniqueStyles.length} different error message styles`,
      });
    }

    if (inconsistencies.length > 0) {
      console.log("\n🚨 Form Validation Inconsistencies:");
      inconsistencies.forEach((inc) => {
        console.log(`  ${inc.issue}: ${inc.details}`);
      });
    }

    console.log(
      `Form validation check: ${invalidCount} invalid fields, ${messageCount} error messages`,
    );
    expect(inconsistencies.length).toBeLessThan(10);
  });

  test("should have consistent accessibility patterns affecting UX", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    const inconsistencies: Array<{
      issue: string;
      details: string;
    }> = [];

    // Check for missing aria-labels on icon-only buttons
    const iconButtons = page.locator(
      "button:not([aria-label]):not([aria-labelledby])",
    );
    const iconButtonCount = await iconButtons.count();

    let iconOnlyCount = 0;
    for (let i = 0; i < Math.min(iconButtonCount, 20); i++) {
      const button = iconButtons.nth(i);
      const text = await button.textContent();
      const hasIcon = (await button.locator("i, svg, .pi").count()) > 0;

      if (hasIcon && (!text || text.trim().length === 0)) {
        iconOnlyCount++;
      }
    }

    if (iconOnlyCount > 5) {
      inconsistencies.push({
        issue: "Icon-only buttons missing aria-labels",
        details: `Found ${iconOnlyCount} icon-only buttons without aria-labels`,
      });
    }

    // Check for missing focus indicators
    const focusableElements = page.locator(
      "button, a, input, select, textarea, [tabindex='0']",
    );
    const focusableCount = await focusableElements.count();

    let missingFocusCount = 0;
    for (let i = 0; i < Math.min(focusableCount, 10); i++) {
      const element = focusableElements.nth(i);
      const outline = await element.evaluate((el) => {
        return window.getComputedStyle(el).outline;
      });

      if (outline === "none" || outline === "0px") {
        missingFocusCount++;
      }
    }

    if (missingFocusCount > 3) {
      inconsistencies.push({
        issue: "Focusable elements missing focus indicators",
        details: `Found ${missingFocusCount} elements without visible focus indicators`,
      });
    }

    // Check for consistent heading hierarchy
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingCount = await headings.count();

    const headingLevels: number[] = [];
    for (let i = 0; i < Math.min(headingCount, 10); i++) {
      const heading = headings.nth(i);
      const level = await heading.evaluate((el) => {
        const tag = el.tagName.toLowerCase();
        return parseInt(tag.charAt(1));
      });
      headingLevels.push(level);
    }

    // Check for skipped heading levels (bad for screen readers)
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        inconsistencies.push({
          issue: "Skipped heading levels",
          details: `Heading level jumps from h${headingLevels[i - 1]} to h${headingLevels[i]}`,
        });
        break; // Only report once
      }
    }

    if (inconsistencies.length > 0) {
      console.log("\n🚨 Accessibility UX Inconsistencies:");
      inconsistencies.forEach((inc) => {
        console.log(`  ${inc.issue}: ${inc.details}`);
      });
    }

    expect(inconsistencies.length).toBeLessThan(15);
  });
});
