import { test, expect } from "@playwright/test";

test("training Library tab shows seeded videos from the live library", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".tabbar a", { hasText: "Training" }).click();
  await page.locator("main.screen").waitFor({ state: "visible" });
  await page.locator(".tt-tab", { hasText: "Library" }).click();
  // the global library (16 seeded videos) loads via anon Supabase read
  await expect(page.locator("app-yt-video").first()).toBeVisible({
    timeout: 15000,
  });
  const count = await page.locator("app-yt-video").count();
  expect(count).toBeGreaterThan(3);
});
