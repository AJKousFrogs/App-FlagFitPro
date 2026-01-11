import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Increased timeout for tests that may wait for auth/API calls
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  reporter: process.env.CI
    ? [
        ["html", { outputFolder: "playwright-report" }],
        ["github"],
        ["junit", { outputFile: "playwright-report/junit.xml" }],
        ["json", { outputFile: "playwright-report/results.json" }],
      ]
    : [
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["list"],
      ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4200",
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
    // Increased timeouts for slower operations
    actionTimeout: 15000, // 15 seconds for actions
    navigationTimeout: 45000, // 45 seconds for navigation
  },
  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // Generic mobile (existing)
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
    // =========================================================================
    // TARGET DEVICES - FlagFit Pro Mobile Responsiveness Audit
    // iPhone 11-17 (iOS 18+ Safari), Samsung Galaxy S23-S25 (Android 15+ Chrome)
    // =========================================================================
    {
      name: "iPhone 11",
      use: {
        viewport: { width: 414, height: 896 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      },
    },
    {
      name: "iPhone 14 Pro",
      use: {
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      },
    },
    {
      name: "iPhone 15 Pro Max",
      use: {
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      },
    },
    {
      name: "iPhone 17 Pro Max",
      use: {
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1",
      },
    },
    {
      name: "Samsung Galaxy S23",
      use: {
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 15; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      use: {
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "Samsung Galaxy S25 Ultra",
      use: {
        viewport: { width: 430, height: 1440 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 15; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env.CI, // Always reuse in local dev, force start in CI
    timeout: 180 * 1000, // 3 minutes for server startup
    stdout: "ignore",
    stderr: "pipe",
  },
  globalSetup: undefined,
  globalTeardown: undefined,
});
