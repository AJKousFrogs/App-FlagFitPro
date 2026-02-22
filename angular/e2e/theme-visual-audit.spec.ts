import { expect, test, type Page } from "@playwright/test";

const APP_URL = process.env["BASE_URL"] || "http://localhost:4200";

const TEST_USER = {
  email: process.env["TEST_USER_EMAIL"] || "aljkous@gmail.com",
  password: process.env["TEST_USER_PASSWORD"] || "Futsal12!!!!",
};

type ThemeMode = "light" | "dark";

async function seedCookieConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
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

async function setThemePreference(page: Page, theme: ThemeMode): Promise<void> {
  await page.addInitScript((value: ThemeMode) => {
    localStorage.setItem("flagfit_theme", value);
  }, theme);
}

async function waitForThemeApplied(page: Page, theme: ThemeMode): Promise<void> {
  await page.waitForSelector(`[data-theme-ready='${theme}']`, {
    timeout: 15000,
  });

  const state = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const meta = document.querySelector('meta[name="theme-color"]');
    const computed = getComputedStyle(html);
    return {
      dataTheme: html.getAttribute("data-theme"),
      bodyHasClass: body.classList.contains(`${html.getAttribute("data-theme")}-theme`),
      colorScheme: computed.colorScheme,
      metaThemeColor: meta?.getAttribute("content") ?? null,
    };
  });

  expect(state.dataTheme).toBe(theme);
  expect(state.bodyHasClass).toBe(true);
  expect(state.colorScheme.includes(theme)).toBe(true);
  expect(state.metaThemeColor).toBe(theme === "dark" ? "#171717" : "#089949");
}

async function login(page: Page): Promise<void> {
  await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  await page.locator('input[type="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"]').fill(TEST_USER.password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/.*(dashboard|onboarding).*/, { timeout: 20000 });

  if (page.url().includes("onboarding")) {
    await page.goto(`${APP_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
  }
}

test.describe("Theme Visual Audit", () => {
  test("captures login page in light and dark modes", async ({ page }, testInfo) => {
    await seedCookieConsent(page);

    for (const theme of ["light", "dark"] as const) {
      await setThemePreference(page, theme);
      await page.goto(`${APP_URL}/login`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await waitForThemeApplied(page, theme);
      await page.waitForTimeout(400);

      await page.screenshot({
        path: testInfo.outputPath(`login-${theme}.png`),
        fullPage: true,
      });
    }
  });

  test("captures authenticated core pages in light and dark modes", async ({
    page,
  }, testInfo) => {
    await seedCookieConsent(page);
    await setThemePreference(page, "light");
    await login(page);

    const routes = ["/dashboard", "/training", "/wellness"] as const;

    for (const theme of ["light", "dark"] as const) {
      await setThemePreference(page, theme);

      for (const route of routes) {
        await page.goto(`${APP_URL}${route}`, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        await waitForThemeApplied(page, theme);
        await page.waitForTimeout(700);

        const routeSlug = route.replace("/", "");
        await page.screenshot({
          path: testInfo.outputPath(`${routeSlug}-${theme}.png`),
          fullPage: true,
        });
      }
    }
  });
});
