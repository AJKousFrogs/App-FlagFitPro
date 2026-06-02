import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

/** Captures each core-journey screen (per viewport) to e2e-smoke/__shots__ for the
 *  gate review. Navigates via the bottom-nav tabs (client-side routing) since the
 *  static server has no SPA deep-link fallback. Visual artifact generator. */
const TABS = ["Today", "Training", "Wellness", "Stats", "More"] as const;
const DIR = "e2e-smoke/__shots__";

test("capture core-journey screenshots", async ({ page }) => {
  mkdirSync(DIR, { recursive: true });
  const w = page.viewportSize()?.width ?? 0;
  await page.goto("/");
  await page.locator("main.screen").waitFor({ state: "visible" });

  for (const tab of TABS) {
    await page.locator(".tabbar a", { hasText: tab }).click();
    await page.locator("main.screen").waitFor({ state: "visible" });
    await page.waitForTimeout(400); // let icons/images settle
    await page.screenshot({
      path: `${DIR}/${tab.toLowerCase()}-${w}.png`,
      fullPage: true,
    });
  }
});
