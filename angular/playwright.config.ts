/**
 * Playwright E2E Test Configuration
 *
 * Run tests with: npx playwright test
 * Run with UI: npx playwright test --ui
 * Run smoke tests: npx playwright test e2e/smoke.spec.ts
 * Run critical flow: npx playwright test e2e/critical-flow-morning-training.spec.ts
 *
 * @version 2.0.0
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
    // Visual regression settings
    toHaveScreenshot: {
      maxDiffPixels: 100, // Allow small differences for anti-aliasing
      threshold: 0.1, // 10% pixel difference threshold
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01, // 1% max difference ratio
    },
  },
  // Snapshot output directory
  snapshotDir: "./e2e/__snapshots__",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
  reporter: process.env["CI"]
    ? [
        ["html", { outputFolder: "playwright-report" }],
        ["github"],
        ["junit", { outputFile: "playwright-report/junit.xml" }],
        ["json", { outputFile: "playwright-report/results.json" }],
        ["list"],
      ]
    : [
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["list"],
      ],

  use: {
    baseURL: process.env["BASE_URL"] || "http://localhost:4200",
    trace: process.env["CI"] ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env["CI"] ? "retain-on-failure" : "off",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // Design system visual regression tests - runs on chromium only for consistent screenshots
    {
      name: "design-system",
      testMatch: /design-system.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // Visual regression tests - Storybook component screenshots
    {
      name: "visual-regression",
      testMatch: /visual-regression\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Main E2E tests
    {
      name: "chromium",
      testIgnore: /visual-regression\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // In CI, only run chromium for faster execution
    ...(process.env["CI"]
      ? []
      : [
          {
            name: "firefox",
            testIgnore: [/design-system.*\.spec\.ts/, /visual-regression\.spec\.ts/],
            use: {
              ...devices["Desktop Firefox"],
              viewport: { width: 1920, height: 1080 },
            },
          },
          {
            name: "webkit",
            testIgnore: [/design-system.*\.spec\.ts/, /visual-regression\.spec\.ts/],
            use: {
              ...devices["Desktop Safari"],
              viewport: { width: 1920, height: 1080 },
            },
          },
        ]),
  ],

  // Local dev server
  webServer: {
    command: process.env["CI"] ? "npm run start" : "npm run start",
    url: "http://localhost:4200",
    reuseExistingServer: true, // Always reuse to avoid conflicts
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
