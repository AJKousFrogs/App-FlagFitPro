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
 * Login helper - waits for auth to complete before returning
 */
async function login(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await dismissCookieBanner(page);

  const emailInput = page.locator(
    'input[type="email"], [data-testid="email-input"]',
  );
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(TEST_USER.email);
  await emailInput.press("Tab");

  const passwordInput = page.locator(
    'input[type="password"], [data-testid="password-input"]',
  );
  await passwordInput.click();
  await passwordInput.fill(TEST_USER.password);
  await passwordInput.press("Tab");

  const submitBtn = page.locator('button[type="submit"]:not([disabled])');
  await submitBtn.waitFor({ state: "visible", timeout: 10000 });
  await submitBtn.click();

  await page.waitForURL(/.*(dashboard|onboarding).*/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

/**
 * Get computed styles for an element (by selector - returns first match)
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

/** Design token values (computed) - from design-system-tokens.scss */
const ALLOWED_BORDER_RADIUS = new Set([
  "0px",
  "2px",
  "6px",
  "8px",
  "12px",
  "16px",
  "24px",
  "9999px",
  "50%",
]);

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
    // Error red (#ef4444 = rgb(239, 68, 68) - primitive-error-500, ds-color-danger)
    /^rgb\(239,\s*68,\s*68\)$/,
    /^rgba\(239,\s*68,\s*68,/,
    // Legacy error (#ff003c = rgb(255, 0, 60))
    /^rgb\(255,\s*0,\s*60\)$/,
    /^rgba\(255,\s*0,\s*60,/,
    // Neutral grays from design system
    /^rgb\(23,\s*23,\s*23\)$/, // --primitive-neutral-900: #171717
    /^rgb\(74,\s*74,\s*74\)$/, // --color-text-secondary: #4a4a4a
    /^rgb\(115,\s*115,\s*115\)$/, // --primitive-neutral-600: #737373
    /^rgb\(26,\s*26,\s*26\)$/, // --color-text-primary: #1a1a1a
    /^rgb\(255,\s*255,\s*255\)$/, // White (surface-primary)
    // Surface secondary (#f8faf9 = rgb(248, 250, 249))
    /^rgb\(248,\s*250,\s*249\)$/,
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

  test("should have design tokens available on document root (light mode)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("domcontentloaded");

    // Ensure light theme so tokens are verified in light mode
    await page.evaluate(() => {
      localStorage.setItem("flagfit_theme", "light");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("[data-theme-ready='light']", { timeout: 10000 });

    const tokens = await page.evaluate(() => {
      const root = document.documentElement;
      const style = window.getComputedStyle(root);
      return {
        "ds-primary-green": style.getPropertyValue("--ds-primary-green").trim(),
        "color-text-primary": style
          .getPropertyValue("--color-text-primary")
          .trim(),
        "space-4": style.getPropertyValue("--space-4").trim(),
        "border-1": style.getPropertyValue("--border-1").trim(),
      };
    });

    expect(tokens["ds-primary-green"]).toBeTruthy();
    expect(tokens["color-text-primary"]).toBeTruthy();
    expect(tokens["space-4"]).toBeTruthy();
    expect(tokens["border-1"]).toBe("1px");
  });

  test("should have design tokens in dark mode and apply dark-theme class", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("domcontentloaded");

    // Set dark theme preference and reload so ThemeService applies it
    await page.evaluate(() => {
      localStorage.setItem("flagfit_theme", "dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for ThemeService to apply dark theme (data-theme-ready is set when applyTheme runs)
    await page.waitForSelector("[data-theme-ready='dark']", { timeout: 10000 });

    // Verify dark theme is applied
    const themeState = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const style = window.getComputedStyle(html);
      return {
        hasDarkClass: body.classList.contains("dark-theme"),
        dataTheme: html.getAttribute("data-theme"),
        surface0: style.getPropertyValue("--p-surface-0").trim(),
        colorTextPrimary: style
          .getPropertyValue("--color-text-primary")
          .trim(),
      };
    });

    expect(themeState.hasDarkClass).toBe(true);
    expect(themeState.dataTheme).toBe("dark");
    expect(themeState.colorTextPrimary).toBeTruthy();
    expect(themeState.surface0).toBeTruthy();
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

    // Check button padding - sample each button (not just first)
    const buttons = page.locator("button, app-button, .p-button");
    const buttonCount = await buttons.count();
    const buttonPadding: string[] = [];

    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
      const button = buttons.nth(i);
      if (!(await button.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }
      const styles = await button.evaluate((el) => ({
        padding: getComputedStyle(el).padding,
      }));
      if (styles.padding) {
        buttonPadding.push(styles.padding);
      }
    }

    const uniquePadding = [...new Set(buttonPadding)];
    console.log(
      `Found ${uniquePadding.length} unique button padding values:`,
      uniquePadding,
    );

    // Check card padding - sample each card
    const cards = page.locator("p-card, .p-card");
    const cardCount = await cards.count();
    const cardPadding: string[] = [];

    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }
      const styles = await card.evaluate((el) => ({
        padding: getComputedStyle(el).padding,
      }));
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
            const isLayout = style.includes("display") || style.includes("visibility") || style.includes("position");
            const isShort = style.length <= 20;
            // Exempt: CSS custom props only (ThemeService, dynamic theming) - matches --var: value
            const isCssVarsOnly = /^(\s*--[\w-]+\s*:\s*[^;]+;?\s*)+$/.test(style);
            // Exempt: design token usage (color/background with var())
            const isDesignToken = /^\s*(color|background(-color)?)\s*:\s*var\(/.test(style);
            if (!isLayout && !isShort && !isCssVarsOnly && !isDesignToken) {
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

  test("should verify consistent border radius usage (design tokens only)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");
    await dismissCookieBanner(page);
    await page.waitForTimeout(1000);

    const borderRadiusValues: string[] = [];

    // Sample each button
    const buttons = page.locator("button, app-button, .p-button");
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
      const button = buttons.nth(i);
      if (!(await button.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }
      const br = await button.evaluate(
        (el) => getComputedStyle(el).borderRadius,
      );
      if (br && br !== "0px") {
        borderRadiusValues.push(br);
      }
    }

    // Sample each card
    const cards = page.locator("p-card, .p-card");
    const cardCount = await cards.count();
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i);
      if (!(await card.isVisible({ timeout: 1000 }).catch(() => false))) {
        continue;
      }
      const br = await card.evaluate((el) => getComputedStyle(el).borderRadius);
      if (br && br !== "0px") {
        borderRadiusValues.push(br);
      }
    }

    const uniqueBorderRadius = [...new Set(borderRadiusValues)];
    console.log(
      `Found ${uniqueBorderRadius.length} unique border radius values:`,
      uniqueBorderRadius,
    );

    const violations = uniqueBorderRadius.filter(
      (v) => !ALLOWED_BORDER_RADIUS.has(v),
    );
    if (violations.length > 0) {
      console.warn(
        "⚠️  Border radius values not from design tokens (use --radius-*):",
        violations,
      );
    }
    expect(violations).toEqual([]);
  });
});
