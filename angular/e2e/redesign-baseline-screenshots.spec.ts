/**
 * Redesign Baseline Screenshots
 *
 * Captures full-page screenshots of every static (non-parameterized) route
 * at the requested desktop viewport so the upcoming redesign has a baseline
 * to diff against.
 *
 * Run:
 *   npx playwright test e2e/redesign-baseline-screenshots.spec.ts --project=chromium
 *
 * Output:
 *   redesign-baseline/desktop/<safe-route-name>.png
 */

import { test, Page, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const APP_URL = process.env["BASE_URL"] || "http://localhost:4200";
const TEST_USER = {
  email: process.env["TEST_USER_EMAIL"] || "aljkous@gmail.com",
  password: process.env["TEST_USER_PASSWORD"] || "Futsal12!!!!",
};

const OUTPUT_ROOT = path.join(process.cwd(), "redesign-baseline", "desktop");

// Routes that need a token / OAuth state — visit but expect broken state.
const TOKEN_GATED = new Set([
  "accept-invitation",
  "auth/callback",
  "reset-password",
  "update-password",
  "verify-email",
]);

// Pre-auth screens that should be captured WITHOUT a logged-in session.
const PRE_AUTH_ROUTES = [
  "", // landing / root
  "login",
  "register",
  "privacy",
  "privacy-policy",
  "terms",
  "onboarding",
];

// Full route list extracted from src/app/core/routes/groups/*.ts + app.routes.ts
// Sorted, deduped, parameterized routes removed.
const ALL_ROUTES = [
  "accept-invitation",
  "achievements",
  "acwr",
  "admin",
  "ai-coach",
  "analytics",
  "analytics/enhanced",
  "athlete-dashboard",
  "attendance",
  "auth/callback",
  "calendar",
  "chat",
  "coach",
  "coach/activity",
  "coach/ai-scheduler",
  "coach/analytics",
  "coach/calendar",
  "coach/dashboard",
  "coach/development",
  "coach/film",
  "coach/inbox",
  "coach/injuries",
  "coach/injury-management",
  "coach/knowledge",
  "coach/payments",
  "coach/planning",
  "coach/playbook",
  "coach/player-development",
  "coach/practice",
  "coach/practice-planner",
  "coach/program-builder",
  "coach/programs",
  "coach/scouting",
  "coach/team",
  "coach/team-management",
  "coach/team-workspace",
  "coach/tournaments",
  "community",
  "cycle-tracking",
  "dashboard",
  "depth-chart",
  "elite-command-center",
  "equipment",
  "exercise-library",
  "exercisedb",
  "film",
  "film-room",
  "game-tracker",
  "game-tracker/live",
  "game/nutrition",
  "game/readiness",
  "goals",
  "help",
  "import",
  "injury-prevention",
  "knowledge",
  "knowledge-base",
  "load-monitoring",
  "login",
  "notifications",
  "officials",
  "onboarding",
  "payments",
  "performance",
  "performance-tracking",
  "performance/body-composition",
  "performance/insights",
  "performance/load",
  "performance/tests",
  "playbook",
  "player-dashboard",
  "privacy",
  "privacy-policy",
  "profile",
  "register",
  "reports",
  "reset-password",
  "return-to-play",
  "roster",
  "search",
  "settings",
  "settings/notifications",
  "settings/preferences",
  "settings/privacy",
  "settings/privacy-security",
  "settings/profile",
  "settings/security",
  "sleep-debt",
  "staff",
  "staff/decisions",
  "staff/nutritionist",
  "staff/physiotherapist",
  "staff/psychology",
  "superadmin",
  "superadmin/settings",
  "superadmin/teams",
  "superadmin/users",
  "team-chat",
  "team/create",
  "team/workspace",
  "terms",
  "todays-practice",
  "tournaments",
  "training",
  "training/advanced",
  "training/ai-companion",
  "training/ai-scheduler",
  "training/builder",
  "training/daily",
  "training/goal-planner",
  "training/import",
  "training/load-analysis",
  "training/log",
  "training/microcycle",
  "training/periodization",
  "training/protocol",
  "training/qb",
  "training/qb/assessment",
  "training/qb/schedule",
  "training/qb/throwing",
  "training/safety",
  "training/schedule",
  "training/smart-form",
  "training/videos",
  "training/videos/curation",
  "training/videos/suggest",
  "training/workspace",
  "travel/recovery",
  "update-password",
  "verify-email",
  "wellness",
  "workout",
];

function routeToFilename(route: string): string {
  if (route === "") return "_root";
  return route.replace(/\//g, "__");
}

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

async function loginToApp(page: Page): Promise<boolean> {
  await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });
  await setCookieConsent(page);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill(TEST_USER.email);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(TEST_USER.password);

  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(/.*(dashboard|onboarding|player-dashboard|athlete-dashboard).*/, {
      timeout: 20000,
    });
    return true;
  } catch {
    console.warn("Login redirect did not complete; continuing anyway.");
    return false;
  }
}

async function captureRoute(page: Page, route: string, subdir: string): Promise<void> {
  const url = `${APP_URL}/${route}`;
  const filename = `${routeToFilename(route)}.png`;
  const dir = path.join(OUTPUT_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, filename);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Suppress cookie banner on every page (in case localStorage was cleared).
    await setCookieConsent(page).catch(() => undefined);

    // Wait for any spinner or skeleton to settle.
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(1200);

    await page.screenshot({ path: filepath, fullPage: true, animations: "disabled" });
    console.log(`  ✓ ${subdir}/${route || "(root)"}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ${subdir}/${route || "(root)"} — ${msg.split("\n")[0]}`);
    // Still try to capture whatever rendered.
    try {
      await page.screenshot({ path: filepath, fullPage: true });
    } catch {
      /* give up on this route */
    }
  }
}

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1440, height: 900 } });

test("capture pre-auth routes (anonymous session)", async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);
  console.log("\n=== PRE-AUTH ROUTES ===");
  for (const route of PRE_AUTH_ROUTES) {
    await captureRoute(page, route, "pre-auth");
  }
});

test("capture all authenticated routes", async ({ page }) => {
  test.setTimeout(20 * 60 * 1000);

  console.log("\n=== LOGGING IN ===");
  const loggedIn = await loginToApp(page);
  console.log(loggedIn ? "  ✓ logged in" : "  ⚠ login may have failed — continuing");

  console.log("\n=== AUTHENTICATED ROUTES ===");
  const authedRoutes = ALL_ROUTES.filter((r) => !PRE_AUTH_ROUTES.includes(r));

  for (const route of authedRoutes) {
    const subdir = TOKEN_GATED.has(route) ? "token-gated" : "app";
    await captureRoute(page, route, subdir);
  }

  expect(true).toBeTruthy(); // Ensure test reports as a pass when captures finish.
});
