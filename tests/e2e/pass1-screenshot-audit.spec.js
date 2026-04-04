/**
 * Pass 1 — Mobile UX Screenshot Audit
 *
 * Captures full-page screenshots at 375px (iPhone SE), 768px (iPad), 1280px (desktop)
 * for every key page after P0–P3 fixes. Bypasses Supabase auth via API mocking.
 *
 * Run:
 *   PW_SKIP_WEBSERVER=1 npx playwright test tests/e2e/pass1-screenshot-audit.spec.js \
 *     --project=chromium --reporter=list --workers=1
 */

import { test } from "@playwright/test";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../../playwright-report/pass1-audit");

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 900 },
];

const PAGES = [
  { slug: "player-dashboard", route: "/player-dashboard" },
  { slug: "todays-practice", route: "/todays-practice" },
  { slug: "training", route: "/training" },
  { slug: "wellness", route: "/wellness" },
  { slug: "performance", route: "/performance/insights" },
  { slug: "roster", route: "/roster" },
  { slug: "team-chat", route: "/team-chat" },
  { slug: "tournaments", route: "/tournaments" },
  { slug: "chat-ai", route: "/chat" },
  { slug: "knowledge", route: "/knowledge" },
  { slug: "settings", route: "/settings" },
  { slug: "profile", route: "/profile" },
  { slug: "achievements", route: "/achievements" },
  { slug: "help", route: "/help" },
];

// ── Mock auth data ─────────────────────────────────────────────────────────────

const now = Math.floor(Date.now() / 1000);
const MOCK_USER = {
  id: "test-user-id-12345",
  aud: "authenticated",
  role: "authenticated",
  email: "test@flagfitpro.com",
  email_confirmed_at: "2024-01-01T00:00:00.000Z",
  confirmed_at: "2024-01-01T00:00:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  last_sign_in_at: new Date().toISOString(),
  user_metadata: {
    role: "player",
    firstName: "Test",
    lastName: "Athlete",
    fullName: "Test Athlete",
  },
  app_metadata: { provider: "email" },
};

const MOCK_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  Buffer.from(
    JSON.stringify({
      sub: MOCK_USER.id,
      email: MOCK_USER.email,
      role: "authenticated",
      aud: "authenticated",
      iat: now,
      exp: now + 3600 * 24,
      email_confirmed_at: "2024-01-01T00:00:00.000Z",
      user_metadata: MOCK_USER.user_metadata,
    }),
  ).toString("base64url") +
  ".mock_signature";

const MOCK_SESSION = {
  access_token: MOCK_ACCESS_TOKEN,
  refresh_token: "mock_refresh_token_12345",
  expires_in: 3600,
  expires_at: now + 3600,
  token_type: "bearer",
  user: MOCK_USER,
};

// ── helpers ────────────────────────────────────────────────────────────────────

async function mockSupabaseAuth(page) {
  const supabaseUrl = "https://grfjmnjpzvknmsxrwesx.supabase.co";

  // Intercept Supabase auth API calls
  await page.route(`${supabaseUrl}/auth/v1/**`, (route) => {
    const url = route.request().url();

    if (url.includes("/token") || url.includes("/session")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION),
      });
    }
    if (url.includes("/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_USER),
      });
    }
    // Default auth response
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SESSION),
    });
  });

  // Intercept Supabase REST/DB calls — return empty but valid responses
  await page.route(`${supabaseUrl}/rest/v1/**`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Intercept realtime websocket upgrade (just abort gracefully)
  await page.route(`${supabaseUrl}/realtime/**`, (route) => {
    return route.abort();
  });

  // Pre-populate localStorage with a valid session before Angular loads
  await page.addInitScript(
    ({ session, user, projectRef }) => {
      const storageKey = `sb-${projectRef}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify(session));
      // Also set the user key some Supabase versions use
      localStorage.setItem(`sb-${projectRef}-user`, JSON.stringify(user));
    },
    {
      session: MOCK_SESSION,
      user: MOCK_USER,
      projectRef: "grfjmnjpzvknmsxrwesx",
    },
  );
}

async function ensureOutputDir() {
  await mkdir(OUT, { recursive: true });
}

async function screenshotPage(page, slug) {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500);
    // Close any open toast/overlay
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
    await page.screenshot({
      path: join(OUT, `${vp.name}--${slug}.png`),
      fullPage: true,
    });
    console.log(`  ✓ ${vp.name}--${slug}.png`);
  }
}

// ── tests ──────────────────────────────────────────────────────────────────────

test.describe("Pass 1 – Screenshot Audit", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await ensureOutputDir();
  });

  // ── login page (unauthenticated, no mock needed) ───────────────────────────
  test("login page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: join(OUT, `${vp.name}--login.png`),
        fullPage: true,
      });
    }
  });

  // ── authenticated pages ────────────────────────────────────────────────────
  for (const pg of PAGES) {
    test(pg.slug, async ({ page }) => {
      await mockSupabaseAuth(page);
      await page.goto(pg.route, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(1000);
      await screenshotPage(page, pg.slug);
    });
  }

  // ── onboarding ─────────────────────────────────────────────────────────────
  test("onboarding", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/onboarding", {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    await page.waitForTimeout(1000);
    await screenshotPage(page, "onboarding");
  });
});
