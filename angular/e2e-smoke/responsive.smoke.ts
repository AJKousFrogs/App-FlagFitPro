import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Phase F responsive validation. For every ported route at the configured
 * viewport: client-side navigate, assert NO horizontal overflow, and screenshot.
 * Uncaught errors fail the run.
 */
const ROUTES = [
  "today", "training", "wellness", "stats", "more",
  "supplements", "settings", "achievements", "notifications",
  "acwr", "profile", "competition", "gameday", "chat",
  "return-to-play", "team-chat", "sleep-debt", "roster", "knowledge", "reports",
  "landing", "onboarding",
] as const;
const DIR = "e2e-smoke/__shots__/responsive";

test("every route fits its viewport (no horizontal overflow) + screenshot", async ({ page }, testInfo) => {
  mkdirSync(DIR, { recursive: true });
  const w = page.viewportSize()?.width ?? 0;
  // Real uncaught JS errors only — ignore network failures (no backend in harness).
  const NETWORK = /Failed to fetch|NetworkError|fetch failed|ERR_|Load failed|HttpErrorResponse/i;
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    const s = String(e);
    if (!NETWORK.test(s)) errors.push(s);
  });

  await page.goto("/");
  await page.locator("app-root").waitFor({ state: "attached" });

  const offenders: string[] = [];
  for (const r of ROUTES) {
    await page.evaluate((route) => {
      history.pushState({}, "", `/${route}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, r);
    // wait for the screen (shell screens use main.screen; entry screens too)
    await page.locator("main.screen, app-onboarding, app-landing").first().waitFor({ state: "visible" });
    await page.waitForTimeout(350);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) offenders.push(`${r}@${w}: +${overflow}px`);

    await page.screenshot({ path: `${DIR}/${r}-${w}.png`, fullPage: true });
  }

  expect(errors, `uncaught errors:\n${errors.join("\n")}`).toEqual([]);
  expect(offenders, `horizontal overflow:\n${offenders.join("\n")}`).toEqual([]);
  testInfo.annotations.push({ type: "viewport", description: `${w}px — ${ROUTES.length} routes OK` });
});
