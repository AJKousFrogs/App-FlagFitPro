/**
 * Color Contrast Validator Script
 *
 * Validates all CSS custom properties for WCAG 2.1 AA compliance
 * Tests text (4.5:1) and UI components (3:1)
 */

import { getContrastRatio } from "../app/shared/utils/accessibility.utils";

interface ColorTest {
  name: string;
  foreground: string;
  background: string;
  isLargeText?: boolean;
  isUIComponent?: boolean;
}

interface ContrastResult {
  test: ColorTest;
  ratio: number;
  passes: boolean;
  level: "AA" | "AAA" | "Fail";
  recommendation?: string;
}

// Common color combinations to test from your CSS
const colorTests: ColorTest[] = [
  // Primary brand colors
  {
    name: "Primary text on white",
    foreground: "#1e40af", // --color-brand-primary
    background: "#ffffff",
  },
  {
    name: "Primary text on light background",
    foreground: "#1e40af",
    background: "#f3f4f6",
  },
  {
    name: "White text on primary",
    foreground: "#ffffff",
    background: "#1e40af",
  },

  // Text colors
  {
    name: "Primary text on white",
    foreground: "#1f2937", // --text-primary
    background: "#ffffff",
  },
  {
    name: "Secondary text on white",
    foreground: "#6b7280", // --text-secondary
    background: "#ffffff",
  },
  {
    name: "Muted text on white",
    foreground: "#9ca3af", // --text-muted
    background: "#ffffff",
  },

  // UI Components
  {
    name: "Button focus outline",
    foreground: "#1e40af",
    background: "#ffffff",
    isUIComponent: true,
  },
  {
    name: "Border on white",
    foreground: "#d1d5db", // --p-border-color
    background: "#ffffff",
    isUIComponent: true,
  },

  // Status colors
  {
    name: "Success text on white",
    foreground: "#059669", // --p-success-color
    background: "#ffffff",
  },
  {
    name: "Error text on white",
    foreground: "#dc2626", // --p-error-color
    background: "#ffffff",
  },
  {
    name: "Warning text on white",
    foreground: "#d97706", // --p-warning-color
    background: "#ffffff",
  },
  {
    name: "Info text on white",
    foreground: "#2563eb", // --p-info-color
    background: "#ffffff",
  },

  // Dark mode (if applicable)
  {
    name: "White text on dark background",
    foreground: "#ffffff",
    background: "#1f2937",
  },
  {
    name: "Light text on dark background",
    foreground: "#f3f4f6",
    background: "#1f2937",
  },
];

function validateContrast(test: ColorTest): ContrastResult {
  const ratio = getContrastRatio(test.foreground, test.background);

  // Determine required ratio based on type
  const requiredRatioAA = test.isUIComponent ? 3 : test.isLargeText ? 3 : 4.5;
  const requiredRatioAAA = test.isUIComponent
    ? 4.5
    : test.isLargeText
      ? 4.5
      : 7;

  let level: "AA" | "AAA" | "Fail";
  let passes: boolean;
  let recommendation: string | undefined;

  if (ratio >= requiredRatioAAA) {
    level = "AAA";
    passes = true;
  } else if (ratio >= requiredRatioAA) {
    level = "AA";
    passes = true;
  } else {
    level = "Fail";
    passes = false;
    recommendation = generateRecommendation(test, ratio, requiredRatioAA);
  }

  return { test, ratio, passes, level, recommendation };
}

function generateRecommendation(
  test: ColorTest,
  currentRatio: number,
  requiredRatio: number,
): string {
  const diff = requiredRatio - currentRatio;

  if (diff < 0.5) {
    return `Very close! Darken foreground or lighten background slightly.`;
  } else if (diff < 1) {
    return `Needs moderate adjustment. Consider darker foreground or lighter background.`;
  } else {
    return `Significant contrast issue. Use much darker foreground or much lighter background.`;
  }
}

// Run all tests
console.log("🎨 COLOR CONTRAST VALIDATION");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const results = colorTests.map(validateContrast);

// Group by status
const passed = results.filter((r) => r.passes);
const failed = results.filter((r) => !r.passes);

console.log(`✅ PASSED: ${passed.length}/${results.length}\n`);

passed.forEach((result) => {
  console.log(`✅ ${result.test.name}`);
  console.log(`   Ratio: ${result.ratio.toFixed(2)}:1 (${result.level})`);
  console.log(
    `   FG: ${result.test.foreground} / BG: ${result.test.background}\n`,
  );
});

if (failed.length > 0) {
  console.log(`\n❌ FAILED: ${failed.length}\n`);

  failed.forEach((result) => {
    console.log(`❌ ${result.test.name}`);
    console.log(
      `   Ratio: ${result.ratio.toFixed(2)}:1 (Required: ${result.test.isUIComponent ? "3" : "4.5"}:1)`,
    );
    console.log(
      `   FG: ${result.test.foreground} / BG: ${result.test.background}`,
    );
    console.log(`   💡 ${result.recommendation}\n`);
  });
}

// Summary
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📊 SUMMARY: ${passed.length} passed, ${failed.length} failed`);
console.log(
  `✅ Compliance: ${failed.length === 0 ? "WCAG 2.1 AA ✅" : "Needs fixes ❌"}`,
);
