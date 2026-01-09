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
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env.CI, // Always reuse in local dev
    timeout: 180 * 1000, // 3 minutes for server startup
    stdout: "ignore",
    stderr: "pipe",
    // Add retry logic for server startup
    reuseExistingServer: true,
  },
  globalSetup: undefined,
  globalTeardown: undefined,
});
