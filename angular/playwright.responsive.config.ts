import { defineConfig, devices } from "@playwright/test";

/**
 * Phase F — responsive validation. Every ported route at mobile/tablet/desktop:
 * asserts no horizontal overflow + captures screenshots. Navigates client-side
 * (pushState→popstate) so the static server's lack of SPA deep-link fallback
 * doesn't matter. Run:
 *   npx playwright test --config=playwright.responsive.config.ts
 */
export default defineConfig({
  testDir: "./e2e-smoke",
  testMatch: "**/responsive.smoke.ts",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4320", trace: "off" },
  webServer: {
    command: "npx http-server dist/flagfit-pro/browser -p 4320 -c-1 --silent",
    url: "http://localhost:4320",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
});
