/**
 * Design Tokens Utility Tests
 *
 * Verifies that design token utilities work correctly.
 * Full token availability is tested in E2E: e2e/design-system-compliance.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getCssVariable,
  getCssVariables,
  resolveCssVariable,
  getStatusColor,
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

  it("getStatusColor returns correct token for thresholds", () => {
    expect(getStatusColor(90, 70, 50)).toBe("var(--color-status-success)");
    expect(getStatusColor(60, 70, 50)).toBe("var(--color-status-warning)");
    expect(getStatusColor(30, 70, 50)).toBe("var(--color-status-error)");
  });

  it("SPACING constant has expected values", () => {
    expect(SPACING[4]).toBe("1rem");
    expect(SPACING[8]).toBe("2rem");
  });
});
