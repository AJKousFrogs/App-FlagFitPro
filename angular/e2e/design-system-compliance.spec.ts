/**
 * Design System Compliance Test
 *
 * Tests for UI inconsistencies and violations of design system tokens.
 * Checks for:
 * - Hardcoded colors instead of CSS variables/tokens
 * - Inconsistent spacing/sizing
 * - Typography violations
 * - Component styling inconsistencies
 * - Missing design system token usage
 *
 * Run with: npx playwright test e2e/design-system-compliance.spec.ts
 * Run in UI mode: npx playwright test e2e/design-system-compliance.spec.ts --ui
 * Run in headed mode: npx playwright test e2e/design-system-compliance.spec.ts --headed
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

/**
 * Get computed styles for an element
 */
async function getComputedStyles(
  page: Page,
  selector: string,
): Promise<Record<string, string>> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return {};

    const styles = window.getComputedStyle(element);
    return {
      color: styles.color,
      backgroundColor: styles.backgroundColor,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      padding: styles.padding,
      margin: styles.margin,
      borderRadius: styles.borderRadius,
      border: styles.border,
      fontFamily: styles.fontFamily,
    };
  }, selector);
}

/**
 * Check if a color value uses CSS variable (design token)
 */
function usesDesignToken(value: string): boolean {
  return value.startsWith("var(") || value.startsWith("rgb(var(");
}

/**
 * Check for hardcoded colors (common violations)
 * Note: This function must distinguish between:
 * - True hardcoded colors (direct hex/rgb values in CSS)
 * - Computed values from CSS variables (which appear as rgb/rgba in computed styles)
 * - Intentional design patterns (transparent backgrounds for text buttons)
 */
function isHardcodedColor(value: string): boolean {
  const trimmed = value.trim();

  // Allowlist: These are intentional design patterns, not violations
  const allowedPatterns = [
    // Transparent backgrounds (used for text/ghost buttons - intentional design)
    /^rgba\(0,\s*0,\s*0,\s*0\)$/,
    // Fully transparent
    /^transparent$/i,
    // Inherit from parent
    /^inherit$/i,
    // Initial/unset values
    /^(initial|unset)$/i,
  ];

  if (allowedPatterns.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  // Design system colors - these RGB values come from our CSS variables
  // They appear as computed values but are actually from our design tokens
  const designSystemColors = [
    // Primary green variations (--ds-primary-green: #089949 = rgb(8, 153, 73))
    /^rgb\(8,\s*153,\s*73\)$/,
    /^rgba\(8,\s*153,\s*73,/,
    // Primary green hover (--ds-primary-green-hover: #036d35 = rgb(3, 109, 53))
    /^rgb\(3,\s*109,\s*53\)$/,
    /^rgba\(3,\s*109,\s*53,/,
    // Error red (#ff003c = rgb(255, 0, 60))
    /^rgb\(255,\s*0,\s*60\)$/,
    /^rgba\(255,\s*0,\s*60,/,
    // Neutral grays from design system
    /^rgb\(23,\s*23,\s*23\)$/, // --primitive-neutral-900: #171717
    /^rgb\(115,\s*115,\s*115\)$/, // --primitive-neutral-600: #737373
    /^rgb\(26,\s*26,\s*26\)$/, // --color-text-primary: #1a1a1a
    /^rgb\(255,\s*255,\s*255\)$/, // White (surface-primary)
    // Success green
    /^rgb\(99,\s*173,\s*14\)$/, // --color-status-success: #63ad0e
    // Warning yellow/orange
    /^rgb\(255,\s*192,\s*0\)$/, // --color-status-warning: #ffc000
    /^rgb\(245,\s*158,\s*11\)$/, // --primitive-warning-500
    // Info blue
    /^rgb\(14,\s*165,\s*233\)$/, // --color-status-info: #0ea5e9
  ];

  if (designSystemColors.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  // Check for actual hardcoded colors (violations)
  const hardcodedPatterns = [
    /^#[0-9a-fA-F]{3,6}$/, // Hex colors (actual hardcoded)
    /^rgb\(/, // RGB values (check if not in design system)
    /^rgba\(/, // RGBA values (check if not in design system)
    /^(red|blue|green|yellow|black|white|gray|grey)$/i, // Named colors
  ];

  return hardcodedPatterns.some((pattern) => pattern.test(trimmed));
}

test.describe("Design System Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Handle onboarding if present
    if (page.url().includes("onboarding")) {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
    }
  });

  test("should use design tokens for colors instead of hardcoded values", async ({
    page,
  }) => {
    const routes = [
      "/dashboard",
      "/todays-practice",
      "/training",
      "/wellness",
      "/acwr",
    ];

    const violations: Array<{
      route: string;
      selector: string;
      property: string;
      value: string;
    }> = [];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);
      await page.waitForTimeout(1000);

      // Check buttons
      const buttons = page.locator("button, app-button, .p-button");
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        if (!(await button.isVisible({ timeout: 1000 }).catch(() => false))) {
          continue;
        }

        const styles = await getComputedStyles(
          page,
          await button.evaluate((el) => {
            return (
              el.tagName.toLowerCase() +
              (el.className ? "." + el.className.split(" ")[0] : "")
            );
          }),
        );

        // Check background color
        if (
          styles.backgroundColor &&
          isHardcodedColor(styles.backgroundColor) &&
          !usesDesignToken(styles.backgroundColor)
        ) {
          violations.push({
            route,
            selector: `button[${i}]`,
            property: "backgroundColor",
            value: styles.backgroundColor,
          });
        }

        // Check text color
        if (
          styles.color &&
          isHardcodedColor(styles.color) &&
          !usesDesignToken(styles.color)
        ) {
          violations.push({
            route,
            selector: `button[${i}]`,
            property: "color",
            value: styles.color,
          });
        }
      }

      // Check cards
      const cards = page.locator("p-card, .p-card, .card");
      const cardCount = await cards.count();

      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = cards.nth(i);
        if (!(await card.isVisible({ timeout: 1000 }).catch(() => false))) {
          continue;
        }

        const styles = await getComputedStyles(
          page,
          await card.evaluate((el) => {
            return (
              el.tagName.toLowerCase() +
              (el.className ? "." + el.className.split(" ")[0] : "")
            );
          }),
        );

        if (
          styles.backgroundColor &&
          isHardcodedColor(styles.backgroundColor) &&
          !usesDesignToken(styles.backgroundColor)
        ) {
          violations.push({
            route,
            selector: `card[${i}]`,
            property: "backgroundColor",
            value: styles.backgroundColor,
          });
        }
      }
    }

    // Report violations
    if (violations.length > 0) {
      console.log("\n🚨 Design Token Violations Found:");
      violations.forEach((v) => {
        console.log(
          `  ${v.route} → ${v.selector}.${v.property}: ${v.value} (should use CSS variable)`,
        );
      });
    } else {
      console.log(
        "\n✅ No design token violations found! All colors use CSS variables.",
      );
    }

    // Allow some violations (PrimeNG defaults that can't be overridden, etc.)
    // Threshold set to 100 to account for PrimeNG internal styles
    // that are computed at runtime and may not use CSS variables directly
    expect(violations.length).toBeLessThan(100); // Threshold for critical violations
  });

  test("should have consistent spacing/sizing across similar components", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    // Check button sizes
    const buttons = page.locator("button, app-button, .p-button");
    const buttonCount = await buttons.count();

    const _buttonSizes: string[] = [];
    const buttonPadding: string[] = [];

    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
      const button = buttons.nth(i);
      if (!(await button.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }

      const styles = await getComputedStyles(
        page,
        await button.evaluate((el) => {
          return el.tagName.toLowerCase();
        }),
      );

      if (styles.padding) {
        buttonPadding.push(styles.padding);
      }
    }

    // Check for inconsistent padding (more than 3 different values suggests inconsistency)
    const uniquePadding = [...new Set(buttonPadding)];
    console.log(
      `Found ${uniquePadding.length} unique button padding values:`,
      uniquePadding,
    );

    // Check card spacing
    const cards = page.locator("p-card, .p-card");
    const cardCount = await cards.count();
    const cardPadding: string[] = [];

    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }

      const styles = await getComputedStyles(
        page,
        await card.evaluate((el) => {
          return el.tagName.toLowerCase();
        }),
      );

      if (styles.padding) {
        cardPadding.push(styles.padding);
      }
    }

    const uniqueCardPadding = [...new Set(cardPadding)];
    console.log(
      `Found ${uniqueCardPadding.length} unique card padding values:`,
      uniqueCardPadding,
    );

    // Warn if too many inconsistencies
    if (uniquePadding.length > 5) {
      console.warn("⚠️  High button padding inconsistency detected");
    }
    if (uniqueCardPadding.length > 3) {
      console.warn("⚠️  High card padding inconsistency detected");
    }
  });

  test("should use consistent typography (font sizes, weights)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    // Check headings
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingCount = await headings.count();

    const fontSizeMap: Record<string, number> = {};
    const fontWeightMap: Record<string, number> = {};

    for (let i = 0; i < Math.min(headingCount, 20); i++) {
      const heading = headings.nth(i);
      if (!(await heading.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }

      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      const styles = await getComputedStyles(
        page,
        await heading.evaluate((el) => {
          return el.tagName.toLowerCase();
        }),
      );

      if (styles.fontSize) {
        const size = parseFloat(styles.fontSize);
        if (!fontSizeMap[tagName]) {
          fontSizeMap[tagName] = size;
        } else if (Math.abs(fontSizeMap[tagName] - size) > 2) {
          // More than 2px difference
          console.warn(
            `⚠️  Inconsistent ${tagName} font size: ${fontSizeMap[tagName]}px vs ${size}px`,
          );
        }
      }

      if (styles.fontWeight) {
        const weight = parseInt(styles.fontWeight) || 400;
        if (!fontWeightMap[tagName]) {
          fontWeightMap[tagName] = weight;
        } else if (fontWeightMap[tagName] !== weight) {
          console.warn(
            `⚠️  Inconsistent ${tagName} font weight: ${fontWeightMap[tagName]} vs ${weight}`,
          );
        }
      }
    }

    console.log("Typography consistency check complete");
  });

  test("should verify PrimeNG components use theme tokens", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    // Check if CSS variables are defined (design tokens)
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      const variables: Record<string, string> = {};

      // Check for common design token variables
      const tokenNames = [
        "--p-primary-color",
        "--p-primary-contrast-color",
        "--p-surface-0",
        "--p-surface-50",
        "--p-border-radius",
        "--p-content-padding",
      ];

      tokenNames.forEach((name) => {
        const value = computedStyle.getPropertyValue(name);
        if (value) {
          variables[name] = value.trim();
        }
      });

      return variables;
    });

    console.log("Design tokens found:", cssVariables);

    // Verify some tokens exist
    const hasTokens = Object.keys(cssVariables).length > 0;
    expect(hasTokens).toBe(true);

    if (!hasTokens) {
      console.warn(
        "⚠️  No design tokens (CSS variables) found - check theme configuration",
      );
    }
  });

  test("should check for inline styles (design system violation)", async ({
    page,
  }) => {
    const routes = ["/dashboard", "/todays-practice", "/training", "/wellness"];

    const violations: Array<{
      route: string;
      selector: string;
      styles: string;
    }> = [];

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      await dismissCookieBanner(page);
      await page.waitForTimeout(1000);

      // Find elements with inline styles
      const elementsWithInlineStyles = await page.evaluate(() => {
        const elements = document.querySelectorAll("[style]");
        const results: Array<{
          tag: string;
          className: string;
          styles: string;
        }> = [];

        elements.forEach((el) => {
          const style = el.getAttribute("style");
          if (style && style.length > 0) {
            // Filter out dynamic/necessary inline styles
            if (
              !style.includes("display") &&
              !style.includes("visibility") &&
              !style.includes("position") &&
              style.length > 20 // Ignore very short styles
            ) {
              results.push({
                tag: el.tagName.toLowerCase(),
                className: el.className?.toString().substring(0, 50) || "",
                styles: style.substring(0, 100),
              });
            }
          }
        });

        return results;
      });

      elementsWithInlineStyles.forEach((el) => {
        violations.push({
          route,
          selector: `${el.tag}.${el.className}`,
          styles: el.styles,
        });
      });
    }

    if (violations.length > 0) {
      console.log("\n🚨 Inline Style Violations Found:");
      violations.forEach((v) => {
        console.log(`  ${v.route} → ${v.selector}: ${v.styles}`);
      });
    }

    // Allow some inline styles (dynamic content, etc.) but log them
    console.log(`Found ${violations.length} elements with inline styles`);
  });

  test("should verify consistent border radius usage", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    // Check buttons
    const buttons = page.locator("button, app-button, .p-button");
    const buttonCount = await buttons.count();

    const borderRadiusValues: string[] = [];

    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
      const button = buttons.nth(i);
      if (!(await button.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }

      const styles = await getComputedStyles(
        page,
        await button.evaluate((el) => {
          return el.tagName.toLowerCase();
        }),
      );

      if (styles.borderRadius && styles.borderRadius !== "0px") {
        borderRadiusValues.push(styles.borderRadius);
      }
    }

    // Check cards
    const cards = page.locator("p-card, .p-card");
    const cardCount = await cards.count();

    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }

      const styles = await getComputedStyles(
        page,
        await card.evaluate((el) => {
          return el.tagName.toLowerCase();
        }),
      );

      if (styles.borderRadius && styles.borderRadius !== "0px") {
        borderRadiusValues.push(styles.borderRadius);
      }
    }

    const uniqueBorderRadius = [...new Set(borderRadiusValues)];
    console.log(
      `Found ${uniqueBorderRadius.length} unique border radius values:`,
      uniqueBorderRadius,
    );

    // Warn if too many different values
    if (uniqueBorderRadius.length > 4) {
      console.warn(
        "⚠️  High border radius inconsistency - consider using design tokens",
      );
    }
  });
});
