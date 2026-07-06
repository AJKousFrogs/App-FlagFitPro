import { defineConfig, devices } from "@playwright/test";

/**
 * Phase E/F smoke — serves the built browser bundle and walks the rebuilt core
 * journey in a real Chromium (desktop + mobile viewport). Separate from the
 * legacy ./e2e suite (which targets the demolished UI). Run:
 *   npx playwright test --config=playwright.smoke.config.ts
 */
export default defineConfig({
  testDir: "./e2e-smoke",
  testMatch: "**/*.smoke.ts",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4319", trace: "off" },
  webServer: {
    command:
      "npx http-server dist/flagfit-pro/browser -p 4319 -c-1 --silent --proxy http://localhost:4319?",
    url: "http://localhost:4319",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
});
