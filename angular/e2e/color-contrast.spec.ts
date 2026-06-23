/**
 * E2E Color Contrast — Phase E design system.
 *
 * The LOCKED decision (angular/src/scss/tokens/_tokens.scss): `--accent` is the
 * bright mint #00E07A and it pairs with `--on-accent` = #08090B (near-black ink).
 * Dark ink on mint is CORRECT (~11:1); white-on-mint would FAIL WCAG AA (~1.8:1).
 *
 * This spec therefore enforces WCAG AA *contrast ratios* — NOT the legacy
 * "always white text on green" rule, which was inverted for this palette and
 * tested PrimeNG `.p-*` selectors that no longer exist (the static-first rebuild
 * removed PrimeNG). We test the real design-system selectors (`.btn.primary`,
 * `.btn`, `.chip`) and lock in the ink-on-accent pairing.
 *
 * Run: npx playwright test e2e/color-contrast.spec.ts
 *
 * @version 2.0.0
 */

import { expect, test } from "@playwright/test";

// WCAG 2.1 thresholds.
const AA_NORMAL = 4.5; // normal-size text
const AA_LARGE = 3.0; // large text (≥24px, or ≥18.66px bold) and UI components

/** Parse "rgb(r, g, b)" / "rgba(r, g, b, a)" into [r,g,b] (0–255) or null. */
function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Relative luminance per WCAG (sRGB). */
function luminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two parsed colors. */
function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Resolve design tokens to concrete rgb() strings by probing the live cascade —
 * `getComputedStyle` on a custom property can return an unresolved `var(--c-…)`
 * reference, so we let the browser resolve it on a throwaway element instead.
 */
async function resolveTokens(
  page: import("@playwright/test").Page,
  tokens: string[],
): Promise<Record<string, string>> {
  return page.evaluate((names: string[]) => {
    const probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    document.body.appendChild(probe);
    const out: Record<string, string> = {};
    for (const name of names) {
      probe.style.color = "";
      probe.style.color = `var(${name})`;
      out[name] = getComputedStyle(probe).color;
    }
    probe.remove();
    return out;
  }, tokens);
}

test.describe("Color Contrast — Phase E tokens (ink-on-accent)", () => {
  test("the accent ↔ on-accent token pairing meets WCAG AA", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const t = await resolveTokens(page, ["--accent", "--on-accent"]);
    const accent = parseRgb(t["--accent"]);
    const onAccent = parseRgb(t["--on-accent"]);

    expect(accent, `--accent did not resolve to rgb (got "${t["--accent"]}")`).not.toBeNull();
    expect(onAccent, `--on-accent did not resolve to rgb (got "${t["--on-accent"]}")`).not.toBeNull();

    const ratio = contrastRatio(accent!, onAccent!);
    expect(
      ratio,
      `--on-accent (${t["--on-accent"]}) on --accent (${t["--accent"]}) is ${ratio.toFixed(2)}:1 — below WCAG AA ${AA_NORMAL}:1`,
    ).toBeGreaterThanOrEqual(AA_NORMAL);

    // Lock the decision: on-accent is the DARK ink, not white. White on this
    // mint accent is the regression we are guarding against.
    expect(
      luminance(onAccent!),
      `--on-accent should be dark ink for the mint accent, got ${t["--on-accent"]}`,
    ).toBeLessThan(0.2);
  });

  test("body text meets WCAG AA against the page background", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const t = await resolveTokens(page, ["--text", "--bg", "--text-muted", "--text-faint"]);
    const bg = parseRgb(t["--bg"]);
    expect(bg, `--bg did not resolve (got "${t["--bg"]}")`).not.toBeNull();

    for (const token of ["--text", "--text-muted", "--text-faint"]) {
      const fg = parseRgb(t[token]);
      expect(fg, `${token} did not resolve (got "${t[token]}")`).not.toBeNull();
      const ratio = contrastRatio(fg!, bg!);
      expect(
        ratio,
        `${token} (${t[token]}) on --bg (${t["--bg"]}) is ${ratio.toFixed(2)}:1 — below WCAG AA ${AA_NORMAL}:1`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  test("primary buttons use the dark ink-on-accent pairing (not white) and meet AA", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Real design-system selector (.btn.primary), not PrimeNG. Skip the route
    // gracefully if no primary CTA is rendered on it.
    const buttons = await page.locator("button.btn.primary, a.btn.primary").all();
    test.skip(buttons.length === 0, "No .btn.primary rendered on this route");

    for (const button of buttons) {
      if (!(await button.isVisible().catch(() => false))) continue;

      const { bg, fg } = await button.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, fg: s.color };
      });
      const bgRgb = parseRgb(bg);
      const fgRgb = parseRgb(fg);
      if (!bgRgb || !fgRgb) continue; // gradient/transparent — covered by the token test

      // The text must be the dark on-accent ink, never white-on-mint.
      expect(
        luminance(fgRgb),
        `Primary button text should be dark ink-on-accent, got ${fg} on ${bg}`,
      ).toBeLessThan(0.4);

      const ratio = contrastRatio(bgRgb, fgRgb);
      expect(
        ratio,
        `Primary button contrast ${ratio.toFixed(2)}:1 (text ${fg} on ${bg}) is below WCAG AA ${AA_NORMAL}:1`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  test("buttons and chips meet WCAG AA (UI-component threshold)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const violations = await page.evaluate(
      ({ aaLarge }) => {
        const parse = (c: string): [number, number, number] | null => {
          const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
        };
        const lum = ([r, g, b]: [number, number, number]) => {
          const [rs, gs, bs] = [r, g, b].map((c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        const ratio = (
          a: [number, number, number],
          b: [number, number, number],
        ) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

        const out: string[] = [];
        document.querySelectorAll<HTMLElement>(".btn, .chip").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return; // not rendered
          const s = window.getComputedStyle(el);
          const bg = parse(s.backgroundColor);
          const fg = parse(s.color);
          // Transparent backgrounds (.btn.ghost, gradients) resolve against the
          // page surface — out of scope for this element-local check.
          if (!bg || !fg || s.backgroundColor.includes("rgba(0, 0, 0, 0)")) return;
          const cr = ratio(bg, fg);
          if (cr < aaLarge) {
            out.push(
              `${el.className.trim()}: ${cr.toFixed(2)}:1 (text ${s.color} on ${s.backgroundColor})`,
            );
          }
        });
        return out;
      },
      { aaLarge: AA_LARGE },
    );

    expect(
      violations,
      `Found ${violations.length} button/chip contrast violations:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
