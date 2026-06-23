// @vitest-environment jsdom
/**
 * Design Tokens Utility Tests
 *
 * Verifies that design token utilities work correctly.
 * Full token availability is tested in E2E: e2e/design-system-compliance.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  BREAKPOINTS,
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
    --accent: #00E07A;
    --s-4: 1rem;
    --s-6: 2rem;
        --good: #00E07A;
        --warn: #FFB020;
        --danger: #FF4D4D;
      }
    `;
    document.head.appendChild(styleEl);
  });

  afterEach(() => {
    document.head.removeChild(styleEl);
  });

  it("getCssVariable returns token value from :root", () => {
    const value = getCssVariable("--accent");
    expect(value).toBeTruthy();
    expect(value).toMatch(/#[0-9a-f]{6}/i);
  });

  it("getCssVariables returns multiple tokens", () => {
    const vars = getCssVariables(["--accent", "--s-4"]);
    expect(vars["--accent"]).toBeTruthy();
    expect(vars["--s-4"]).toBe("1rem");
  });

  it("resolveCssVariable resolves var() reference", () => {
    const resolved = resolveCssVariable("var(--accent)");
    expect(resolved).toBeTruthy();
  });

  it("hexToRgba resolves var() then applies alpha", () => {
    const rgba = hexToRgba("var(--accent)", 0.5);
    expect(rgba).toMatch(/^rgba\(0,\s*224,\s*122,\s*0\.5\)$/);
  });

  it("getStatusColor returns correct token for thresholds", () => {
    expect(getStatusColor(90, 70, 50)).toBe("var(--good)");
    expect(getStatusColor(60, 70, 50)).toBe("var(--warn)");
    expect(getStatusColor(30, 70, 50)).toBe("var(--danger)");
  });

  it("SPACING constant has expected values", () => {
    expect(SPACING[4]).toBe(cssToken("--s-4"));
    expect(SPACING[7]).toBe("28px");
    expect(SPACING[8]).toBe(cssToken("--s-6"));
    expect(SPACING[11]).toBe("44px");
  });

  it("BREAKPOINTS.mdMax matches CSS --breakpoint-md-max (767px) for max-width media queries", () => {
    expect(BREAKPOINTS.mdMax).toBe("767px");
  });

  it("LAYOUT_CSS_VARS expose the canonical app width chain", () => {
    expect(LAYOUT_CSS_VARS.appContentMaxWidth).toBe("1280px");
    expect(LAYOUT_CSS_VARS.pageMaxWidthWide).toBe("1280px");
    expect(LAYOUT_CSS_VARS.shellContentMaxWidth).toBe("480px");
    expect(LAYOUT_CSS_VARS.onboardingMaxWidth).toBe("560px");
  });
});
