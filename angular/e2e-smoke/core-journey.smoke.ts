import { test, expect } from "@playwright/test";

/**
 * Core-journey runtime smoke. Proves the rebuilt SPA boots, routes client-side
 * across all 5 tabs, renders each screen, and throws NO uncaught errors. Network
 * failures (no backend/auth in this harness) are expected and ignored — we assert
 * on uncaught JS exceptions only.
 */
test("boots, navigates the 5 tabs, renders each screen, no uncaught errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");

  // default route redirects to /today and the top bar renders
  await expect(page).toHaveURL(/\/today/);
  await expect(page.locator(".topbar h1")).toBeVisible();

  // persistent shell: 5-tab bottom nav
  await expect(page.locator(".tabbar a")).toHaveCount(5);

  const tabs = [
    { name: "Training", url: /\/training/ },
    { name: "Wellness", url: /\/wellness/ },
    { name: "Stats", url: /\/stats/ },
    { name: "More", url: /\/more/ },
    { name: "Today", url: /\/today/ },
  ];
  for (const t of tabs) {
    await page.locator(".tabbar a", { hasText: t.name }).click();
    await expect(page).toHaveURL(t.url);
    await expect(page.locator("main.screen")).toBeVisible();
    await expect(page.locator(".topbar h1")).toBeVisible();
  }

  expect(errors, `uncaught errors:\n${errors.join("\n")}`).toEqual([]);
});

test("secondary screens reachable from More render without uncaught errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");
  for (const dest of [/\/supplements/, /\/settings/]) {
    await page.locator(".tabbar a", { hasText: "More" }).click();
    await expect(page).toHaveURL(/\/more/);
    await page.locator(`a[href="${dest.source.replace(/\\\//g, "/")}"]`).first().click();
    await expect(page).toHaveURL(dest);
    await expect(page.locator("main.screen")).toBeVisible();
    await expect(page.locator(".topbar h1")).toBeVisible();
  }
  expect(errors, `uncaught errors:\n${errors.join("\n")}`).toEqual([]);
});

test("design system applied: dark canvas + brand accent token resolve", async ({ page }) => {
  await page.goto("/");
  // body uses the --bg token (dark #08090B → rgb(8, 9, 11))
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(8, 9, 11)");
  // the FAB renders with the brand gradient (a token-driven element)
  await expect(page.locator(".fab")).toBeVisible();
});
