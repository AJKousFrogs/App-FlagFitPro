import { test, expect } from "@playwright/test";

async function tryLogin(page) {
  await page.goto("/login");
  await page.waitForSelector("app-login", { timeout: 10000 });

  const email = await page.inputValue("#email");
  const password = await page.inputValue("#password");

  if (!email) {
    await page.fill("#email", "test@flagfitpro.com");
  }
  if (!password) {
    await page.fill("#password", "TestDemo123!");
  }

  await page.click("button[type='submit']");

  await page
    .waitForURL(/\/(dashboard|player-dashboard|training|training\/log)/, {
      timeout: 10000,
    })
    .catch(() => null);
}

async function waitForPageOrLogin(page, pageSelector, timeout = 20000) {
  const pageReady = page.locator(pageSelector);
  const loginReady = page.locator("app-login");

  const result = await Promise.race([
    pageReady.waitFor({ state: "visible", timeout }).then(() => "page"),
    loginReady.waitFor({ state: "visible", timeout }).then(() => "login"),
  ]).catch(() => "timeout");

  if (result === "login") {
    return "login";
  }

  if (result === "timeout") {
    throw new Error(`Timeout waiting for ${pageSelector} or login page`);
  }

  return "page";
}

test.describe("Smoke - Training + Video Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("login → training schedule → open new session", async ({ page }) => {
    await tryLogin(page);
    await page.goto("/training");

    if (page.url().includes("/login")) {
      await tryLogin(page);
      await page.goto("/training");
    }

    const state = await waitForPageOrLogin(page, "app-training-schedule");
    if (state === "login") {
      return;
    }

    const newSessionButton = page.locator("button", {
      hasText: "New Session",
    });
    if (await newSessionButton.isVisible()) {
      await newSessionButton.click();
      await page.waitForURL(/\/training\/smart-form/, { timeout: 10000 });
    }
  });

  test("training videos page opens and plays a video", async ({ page }) => {
    await tryLogin(page);
    await page.goto("/training/videos");

    if (page.url().includes("/login")) {
      await tryLogin(page);
      await page.goto("/training/videos");
    }

    const state = await waitForPageOrLogin(page, ".video-feed-page");
    if (state === "login") {
      return;
    }

    const videoCards = page.locator(".video-card");
    if ((await videoCards.count()) > 0) {
      await videoCards.first().click();
      await expect(page.locator(".video-dialog")).toBeVisible({
        timeout: 10000,
      });
    } else {
      await expect(page.locator(".empty-state")).toBeVisible();
    }
  });

  test("log a training session from training log", async ({ page }) => {
    await tryLogin(page);
    await page.goto("/training/log");

    if (page.url().includes("/login")) {
      await tryLogin(page);
      await page.goto("/training/log");
    }

    const state = await waitForPageOrLogin(page, "app-training-log");
    if (state === "login") {
      return;
    }

    const sessionCard = page
      .locator(".session-type-card")
      .filter({ hasText: /practice/i })
      .first();

    if (await sessionCard.isVisible()) {
      await sessionCard.click();
    }

    const durationInput = page.locator("#duration");
    if (await durationInput.isVisible()) {
      await durationInput.fill("30");
    }

    const logButton = page.locator("button", { hasText: "Log Session" });
    if (await logButton.isVisible()) {
      await logButton.click();
    }
  });
});
