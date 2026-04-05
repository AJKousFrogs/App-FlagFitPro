/**
 * Design Tokens Utility Tests
 *
 * Verifies that design token utilities work correctly.
 * Full token availability is tested in E2E: e2e/design-system-compliance.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  BREAKPOINTS,
  CANVAS_CHART_FALLBACK_HEX,
  CHART_SERIES_CSS_VARS,
  cssToken,
  getCssVariable,
  getCssVariables,
  hexToRgba,
  resolveCssVariable,
  getStatusColor,
  LAYOUT_CSS_VARS,
  SPACING,
} from "./design-tokens.util";

describe("design-tokens.util", () => {
  let styleEl: HTMLStyleElement;

  beforeEach(() => {
    styleEl = document.createElement("style");
    styleEl.textContent = `
      :root {
    --ds-primary-green: #089949;
    --space-4: 1rem;
    --space-8: 2rem;
        --color-status-success: #089949;
        --color-status-warning: #f59e0b;
        --color-status-error: #ef4444;
      }
    `;
    document.head.appendChild(styleEl);
  });

  afterEach(() => {
    document.head.removeChild(styleEl);
  });

  it("getCssVariable returns token value from :root", () => {
    const value = getCssVariable("--ds-primary-green");
    expect(value).toBeTruthy();
    expect(value).toMatch(/#[0-9a-f]{6}/i);
  });

  it("getCssVariables returns multiple tokens", () => {
    const vars = getCssVariables(["--ds-primary-green", "--space-4"]);
    expect(vars["--ds-primary-green"]).toBeTruthy();
    expect(vars["--space-4"]).toBe("1rem");
  });

  it("resolveCssVariable resolves var() reference", () => {
    const resolved = resolveCssVariable("var(--ds-primary-green)");
    expect(resolved).toBeTruthy();
  });

  it("hexToRgba resolves var() then applies alpha", () => {
    const rgba = hexToRgba("var(--ds-primary-green)", 0.5);
    expect(rgba).toMatch(/^rgba\(8,\s*153,\s*73,\s*0\.5\)$/);
  });

  it("CHART_SERIES_CSS_VARS and CANVAS_CHART_FALLBACK_HEX stay aligned in length", () => {
    expect(CHART_SERIES_CSS_VARS.length).toBe(6);
    expect(CANVAS_CHART_FALLBACK_HEX.length).toBe(6);
  });

  it("getStatusColor returns correct token for thresholds", () => {
    expect(getStatusColor(90, 70, 50)).toBe("var(--color-status-success)");
    expect(getStatusColor(60, 70, 50)).toBe("var(--color-status-warning)");
    expect(getStatusColor(30, 70, 50)).toBe("var(--color-status-error)");
  });

  it("SPACING constant has expected values", () => {
    expect(SPACING[4]).toBe(cssToken("--space-4"));
    expect(SPACING[7]).toBe(cssToken("--space-7"));
    expect(SPACING[8]).toBe(cssToken("--space-8"));
    expect(SPACING[11]).toBe(cssToken("--space-11"));
  });

  it("BREAKPOINTS.mdMax matches CSS --breakpoint-md-max (767px) for PrimeNG APIs", () => {
    expect(BREAKPOINTS.mdMax).toBe("767px");
  });

  it("LAYOUT_CSS_VARS aliases point at the same canonical width chain", () => {
    expect(LAYOUT_CSS_VARS.appContentMaxWidth).toBe(
      "var(--layout-app-content-max-width)",
    );
    expect(LAYOUT_CSS_VARS.pageMaxWidthWide).toBe(
      "var(--layout-page-max-width-wide)",
    );
    expect(LAYOUT_CSS_VARS.shellContentMaxWidth).toBe(
      "var(--app-shell-content-max-width)",
    );
    expect(LAYOUT_CSS_VARS.onboardingMaxWidth).toBe(
      "var(--layout-onboarding-max-width)",
    );
  });
});
