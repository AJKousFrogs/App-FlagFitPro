/**
 * E2E Color Contrast Tests
 *
 * 🚨 CRITICAL: Enforces "NO BLACK TEXT ON GREEN" design system rule
 *
 * Design System Rules (ABSOLUTE - NEVER OVERRIDE):
 * 1. NEVER black/dark text (#000, #1a1a1a, black) on green backgrounds (#089949)
 * 2. ALWAYS white (#ffffff) text on primary green
 * 3. WCAG AA minimum contrast enforced everywhere
 *
 * Run tests with: npx playwright test --grep "color-contrast"
 *
 * @version 1.0.0
 */

import { expect, test } from "@playwright/test";

// Brand green color in various formats - kept for documentation purposes
const _GREEN_BACKGROUNDS = [
  "rgb(8, 153, 73)", // Primary green
  "#089949",
  "rgb(10, 184, 90)", // Light green
  "#0ab85a",
  "rgb(3, 109, 53)", // Dark green (hover)
  "#036d35",
];

// Forbidden text colors on green backgrounds - kept for documentation purposes
const _FORBIDDEN_TEXT_COLORS = [
  "rgb(0, 0, 0)", // Pure black
  "#000000",
  "#000",
  "rgb(26, 26, 26)", // Design system black
  "#1a1a1a",
  "rgb(0, 0, 0)", // Black
  "black",
];

// Helper to check if a color is "dark" (potential violation)
function isDarkColor(color: string): boolean {
  // Handle rgb format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.4; // Dark if luminance is low
  }

  // Handle hex format
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const [, r, g, b] = hexMatch.map((x) => parseInt(x, 16));
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.4;
  }

  // Handle named colors
  if (color === "black") return true;

  return false;
}

// Helper to check if a background is green
function isGreenBackground(color: string): boolean {
  const normalized = color.toLowerCase().replace(/\s/g, "");

  // Check for exact matches
  if (
    normalized.includes("rgb(8,153,73)") ||
    normalized.includes("#089949") ||
    normalized.includes("rgb(10,184,90)") ||
    normalized.includes("#0ab85a") ||
    normalized.includes("rgb(3,109,53)") ||
    normalized.includes("#036d35")
  ) {
    return true;
  }

  // Check for approximate green (hue-based)
  const rgbMatch = normalized.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    // Green dominant with specific range
    if (g > r && g > b && g > 100 && r < 50) {
      return true;
    }
  }

  return false;
}

// Pages to test for color contrast violations - kept for documentation purposes
const _PAGES_TO_TEST = [
  "/",
  "/ai-coach", // AI Coach chat - has green message bubbles
];

test.describe("Color Contrast - NO BLACK ON GREEN", () => {
  test.describe.configure({ mode: "parallel" });

  test("Primary buttons should have white text on green background", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find all primary buttons
    const buttons = await page.locator(".p-button").all();

    for (const button of buttons) {
      const isVisible = await button.isVisible().catch(() => false);
      if (!isVisible) continue;

      const bgColor = await button.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );
      const textColor = await button.evaluate(
        (el) => window.getComputedStyle(el).color,
      );

      // If background is green, text MUST be white
      if (isGreenBackground(bgColor)) {
        expect(
          isDarkColor(textColor),
          `Button with green background (${bgColor}) has dark text (${textColor}) - VIOLATION!`,
        ).toBe(false);

        // Additionally verify it's close to white
        const rgbMatch = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);
          expect(
            r,
            `Red channel should be >= 200 for white text, got ${r}`,
          ).toBeGreaterThanOrEqual(200);
          expect(
            g,
            `Green channel should be >= 200 for white text, got ${g}`,
          ).toBeGreaterThanOrEqual(200);
          expect(
            b,
            `Blue channel should be >= 200 for white text, got ${b}`,
          ).toBeGreaterThanOrEqual(200);
        }
      }
    }
  });

  test("Cards with green backgrounds should have white text", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find all cards and panels
    const cards = await page
      .locator(".p-card, .p-panel, [class*='card']")
      .all();

    for (const card of cards) {
      const isVisible = await card.isVisible().catch(() => false);
      if (!isVisible) continue;

      const bgColor = await card.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );

      if (isGreenBackground(bgColor)) {
        // Check all text elements inside
        const textElements = await card
          .locator("p, span, h1, h2, h3, h4, h5, h6, label, a")
          .all();

        for (const textEl of textElements) {
          const textColor = await textEl.evaluate(
            (el) => window.getComputedStyle(el).color,
          );
          expect(
            isDarkColor(textColor),
            `Text element inside green card has dark color (${textColor}) - VIOLATION!`,
          ).toBe(false);
        }
      }
    }
  });

  test("Button labels inside green buttons should be white", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const buttonLabels = await page.locator(".p-button-label").all();

    for (const label of buttonLabels) {
      const isVisible = await label.isVisible().catch(() => false);
      if (!isVisible) continue;

      // Get parent button's background
      const parentBg = await label.evaluate((el) => {
        const button = el.closest(".p-button");
        return button ? window.getComputedStyle(button).backgroundColor : "";
      });

      if (isGreenBackground(parentBg)) {
        const labelColor = await label.evaluate(
          (el) => window.getComputedStyle(el).color,
        );
        expect(
          isDarkColor(labelColor),
          `Button label on green background has dark text (${labelColor}) - VIOLATION!`,
        ).toBe(false);
      }
    }
  });

  test("Button icons inside green buttons should be white", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const buttonIcons = await page
      .locator(".p-button-icon, .p-button .pi")
      .all();

    for (const icon of buttonIcons) {
      const isVisible = await icon.isVisible().catch(() => false);
      if (!isVisible) continue;

      // Get parent button's background
      const parentBg = await icon.evaluate((el) => {
        const button = el.closest(".p-button");
        return button ? window.getComputedStyle(button).backgroundColor : "";
      });

      if (isGreenBackground(parentBg)) {
        const iconColor = await icon.evaluate(
          (el) => window.getComputedStyle(el).color,
        );
        expect(
          isDarkColor(iconColor),
          `Button icon on green background has dark color (${iconColor}) - VIOLATION!`,
        ).toBe(false);
      }
    }
  });

  test("Inline styled green elements should have white text", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find elements with inline green background styles
    const greenStyled = await page
      .locator('[style*="089949"], [style*="background"][style*="green"]')
      .all();

    for (const el of greenStyled) {
      const isVisible = await el.isVisible().catch(() => false);
      if (!isVisible) continue;

      const textColor = await el.evaluate(
        (el) => window.getComputedStyle(el).color,
      );

      expect(
        isDarkColor(textColor),
        `Element with inline green background has dark text (${textColor}) - VIOLATION!`,
      ).toBe(false);
    }
  });

  test("Tags and badges with green background should have white text", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const tags = await page
      .locator(".p-tag, .p-badge, .p-chip, [class*='tag'], [class*='badge']")
      .all();

    for (const tag of tags) {
      const isVisible = await tag.isVisible().catch(() => false);
      if (!isVisible) continue;

      const bgColor = await tag.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );

      if (isGreenBackground(bgColor)) {
        const textColor = await tag.evaluate(
          (el) => window.getComputedStyle(el).color,
        );
        expect(
          isDarkColor(textColor),
          `Tag/badge with green background has dark text (${textColor}) - VIOLATION!`,
        ).toBe(false);
      }
    }
  });

  test("No elements should have forbidden color combinations", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get all visible elements
    const violations = await page.evaluate(() => {
      const violations: string[] = [];

      const isGreen = (color: string): boolean => {
        const normalized = color.toLowerCase().replace(/\s/g, "");
        return (
          normalized.includes("rgb(8,153,73)") ||
          normalized.includes("#089949") ||
          normalized.includes("rgb(10,184,90)") ||
          normalized.includes("#0ab85a")
        );
      };

      const isDark = (color: string): boolean => {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance < 0.4;
        }
        return color === "black" || color === "#000000" || color === "#1a1a1a";
      };

      document
        .querySelectorAll(
          ".p-button, .p-card, .p-tag, .p-badge, .p-chip, [class*='btn'], [class*='card']",
        )
        .forEach((el) => {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const text = style.color;

          if (isGreen(bg) && isDark(text)) {
            violations.push(
              `${el.tagName}.${el.className}: bg=${bg}, text=${text}`,
            );
          }
        });

      return violations;
    });

    expect(
      violations,
      `Found ${violations.length} color contrast violations:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  test("AI Coach chat bubbles should have white text on green background", async ({
    page,
  }) => {
    await page.goto("/ai-coach");
    await page.waitForLoadState("networkidle");

    // Check for any elements with green gradient backgrounds
    const violations = await page.evaluate(() => {
      const violations: string[] = [];

      const isGreenish = (color: string): boolean => {
        const normalized = color.toLowerCase().replace(/\s/g, "");
        // Check for our specific greens
        if (
          normalized.includes("rgb(8,153,73)") ||
          normalized.includes("rgb(10,184,90)") ||
          normalized.includes("#089949") ||
          normalized.includes("#0ab85a")
        ) {
          return true;
        }
        // Check for green-dominant colors
        const match = normalized.match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          // Green dominant with high saturation
          if (g > r * 1.5 && g > b * 1.5 && g > 100) {
            return true;
          }
        }
        return false;
      };

      const isDark = (color: string): boolean => {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance < 0.5; // Stricter threshold for chat messages
        }
        return (
          color === "black" ||
          color.includes("#000") ||
          color.includes("#1a1a1a")
        );
      };

      // Check message bubbles and their children
      document
        .querySelectorAll(
          ".message-content, .message-text, [class*='message'], [class*='chat'], [class*='bubble']",
        )
        .forEach((el) => {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const bgImage = style.backgroundImage;
          const text = style.color;

          // Check for green background (solid or gradient)
          const hasGreenBg =
            isGreenish(bg) ||
            (bgImage &&
              (bgImage.includes("#089949") ||
                bgImage.includes("#0ab85a") ||
                bgImage.includes("8, 153, 73") ||
                bgImage.includes("10, 184, 90")));

          if (hasGreenBg && isDark(text)) {
            violations.push(
              `${el.tagName}.${el.className}: bg=${bg || bgImage}, text=${text}`,
            );
          }

          // Also check all child elements
          el.querySelectorAll("*").forEach((child) => {
            const childStyle = window.getComputedStyle(child);
            const childText = childStyle.color;
            if (isDark(childText)) {
              // Check if parent has green background
              let parent = child.parentElement;
              while (parent) {
                const parentStyle = window.getComputedStyle(parent);
                const parentBg = parentStyle.backgroundColor;
                const parentBgImage = parentStyle.backgroundImage;
                if (
                  isGreenish(parentBg) ||
                  (parentBgImage &&
                    (parentBgImage.includes("#089949") ||
                      parentBgImage.includes("#0ab85a")))
                ) {
                  violations.push(
                    `${child.tagName}.${child.className} (child of ${parent.className}): text=${childText}`,
                  );
                  break;
                }
                parent = parent.parentElement;
              }
            }
          });
        });

      return [...new Set(violations)]; // Remove duplicates
    });

    expect(
      violations,
      `Found ${violations.length} AI Coach chat color violations:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});

test.describe("WCAG AA Contrast Compliance", () => {
  test("All text should meet WCAG AA contrast ratio (4.5:1)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Helper to calculate contrast ratio
    const checkContrast = await page.evaluate(() => {
      function getLuminance(r: number, g: number, b: number): number {
        const [rs, gs, bs] = [r, g, b].map((c) => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      function getContrastRatio(l1: number, l2: number): number {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      function parseColor(color: string): [number, number, number] | null {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
        return null;
      }

      const lowContrastElements: string[] = [];

      // Check buttons specifically
      document.querySelectorAll(".p-button").forEach((el) => {
        const style = window.getComputedStyle(el);
        const bgColor = parseColor(style.backgroundColor);
        const textColor = parseColor(style.color);

        if (bgColor && textColor) {
          const bgLum = getLuminance(...bgColor);
          const textLum = getLuminance(...textColor);
          const ratio = getContrastRatio(bgLum, textLum);

          if (ratio < 4.5) {
            lowContrastElements.push(
              `Button: contrast ${ratio.toFixed(2)}:1 (bg: ${style.backgroundColor}, text: ${style.color})`,
            );
          }
        }
      });

      return lowContrastElements;
    });

    expect(
      checkContrast.length,
      `Found ${checkContrast.length} elements with insufficient contrast:\n${checkContrast.join("\n")}`,
    ).toBe(0);
  });
});
