import { test, expect } from "@playwright/test";

test("session video: tapping play loads a YouTube IFrame player", async ({
  page,
}) => {
  await page.goto("/");
  // gallery always renders the player (no backend dependency)
  await page.evaluate(() => {
    history.pushState({}, "", "/gallery");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  const play = page.locator(".video .play").first();
  await expect(play).toBeEnabled();
  await play.click();
  await expect(
    page.locator(".yt-host iframe, iframe[src*='youtube']").first(),
  ).toBeVisible({ timeout: 20000 });
});
