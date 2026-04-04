/**
 * Onboarding route smoke: authenticated users hitting /onboarding see the setup shell.
 * Does not complete the full flow (see critical-flow-morning-training.spec.ts).
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4200";

test.describe("Onboarding route", () => {
  test("shows FlagFit profile setup when visiting /onboarding (authenticated)", async ({
    page,
  }) => {
    const email =
      process.env["TEST_USER_EMAIL"] ||
      process.env["E2E_TEST_EMAIL"] ||
      "aljkous@gmail.com";
    const password =
      process.env["TEST_USER_PASSWORD"] ||
      process.env["E2E_TEST_PASSWORD"] ||
      "Futsal12!!!!";

    await page.addInitScript(() => {
      localStorage.setItem(
        "flagfit_cookie_consent",
        JSON.stringify({
          necessary: true,
          analytics: true,
          functional: true,
          consentDate: new Date().toISOString(),
          consentVersion: "1.0",
        }),
      );
    });

    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await page.waitForURL(/.*(dashboard|onboarding|today|player-dashboard).*/, {
      timeout: 25000,
    });

    await page.goto(`${BASE_URL}/onboarding`, {
      waitUntil: "networkidle",
    });

    const url = page.url();
    if (url.includes("/onboarding")) {
      await expect(
        page.getByRole("heading", { name: /set up your flagfit profile/i }),
      ).toBeVisible({ timeout: 15000 });
      await expect(page.locator("app-onboarding")).toBeVisible();
    } else {
      // Users who already completed onboarding may be redirected home
      expect(url).toMatch(/dashboard|today|player-dashboard|coach-dashboard/i);
    }
  });
});
