/**
 * Redesign checkpoint screenshots
 * Captures a single route at desktop + mobile for quick visual review during the redesign loop.
 *
 * Usage:
 *   PW_REDESIGN_ROUTES="login,register" npx playwright test e2e/redesign-checkpoint.spec.ts --project=chromium
 *
 * Defaults to "login" if no env var supplied.
 */

import { test, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const APP_URL = process.env["BASE_URL"] || "http://localhost:4200";
const OUT_DIR = path.join(process.cwd(), "redesign-baseline", "checkpoints");

const routes = (process.env["PW_REDESIGN_ROUTES"] || "login")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

async function setCookieConsent(page: Page): Promise<void> {
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
}

async function capture(page: Page, route: string, label: string): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filename = `${route.replace(/\//g, "__") || "_root"}-${label}.png`;
  const filepath = path.join(OUT_DIR, filename);

  await page.goto(`${APP_URL}/${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await setCookieConsent(page).catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: filepath, fullPage: true, animations: "disabled" });
  console.log(`  ✓ ${label} → ${filename}`);
}

test.describe.configure({ mode: "serial" });

for (const route of routes) {
  test(`${route} — desktop 1440x900`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      serviceWorkers: "block",
      bypassCSP: true,
    });
    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const headers = { ...route.request().headers(), "cache-control": "no-cache" };
      route.continue({ headers });
    });
    await capture(page, route, "desktop");
    await context.close();
  });

  test(`${route} — mobile 390x844 (iPhone 13)`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: "block",
      bypassCSP: true,
    });
    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const headers = { ...route.request().headers(), "cache-control": "no-cache" };
      route.continue({ headers });
    });
    await capture(page, route, "mobile");
    await context.close();
  });
}
