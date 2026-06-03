import { test, expect } from "@playwright/test";

/**
 * Auth-guard enforcement smoke. The authGuard is wired on every protected route
 * but config-gated (environment.auth.required) so local dev/smoke stays open. In
 * production that flag is true. We simulate production here by injecting
 * window._env.AUTH_REQUIRED='true' BEFORE the bundle boots (the same runtime-env
 * mechanism prod uses) and assert an unauthenticated visitor is bounced to /login.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { _env: Record<string, string> })._env = {
      AUTH_REQUIRED: "true",
    };
  });
});

test("with auth required, an unauthenticated visit to /today redirects to /login", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/today");

  // No session → guard sends them to /login (carrying the returnUrl).
  await expect(page).toHaveURL(/\/login/);
  await expect(page).toHaveURL(/returnUrl/);
  // The landing/login screen renders (its own brand, no app shell tabbar).
  await expect(page.locator(".brand").first()).toBeVisible();
  await expect(page.locator(".tabbar")).toHaveCount(0);

  expect(errors, `uncaught errors:\n${errors.join("\n")}`).toEqual([]);
});

test("with auth required, the bare root also lands on /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator(".tabbar")).toHaveCount(0);
});

test("the /verify-email parking route renders standalone (resend CTA present)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/verify-email");

  await expect(page).toHaveURL(/\/verify-email/);
  await expect(page.locator("main.screen")).toBeVisible();
  await expect(page.getByRole("button", { name: /resend/i })).toBeVisible();
  await expect(page.locator(".tabbar")).toHaveCount(0);

  expect(errors, `uncaught errors:\n${errors.join("\n")}`).toEqual([]);
});
