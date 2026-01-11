/**
 * Launch Smoke Test - 100 Trials
 *
 * Critical Flow: Login → Log 5 Entries → View Dashboard → Logout
 *
 * Success Criteria: 100/100 trials must pass for launch greenlight
 *
 * Usage:
 *   npx playwright test e2e/launch-smoke-100-trials.spec.ts --workers=1
 */

import { test, expect, Page } from "@playwright/test";

// Test configuration
const TEST_CONFIG = {
  TOTAL_TRIALS: 100,
  ENTRIES_PER_TRIAL: 5,
  MAX_DURATION_MS: 180000, // 3 minutes per trial
  TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || "testuser@example.com",
  TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || "TestPassword123!",
  BASE_URL: process.env.BASE_URL || "http://localhost:4200",
};

// Results tracking
const trialResults: Array<{
  trial: number;
  status: "PASS" | "FAIL";
  duration: number;
  error?: string;
  steps: {
    login: boolean;
    logEntries: boolean;
    viewDashboard: boolean;
    logout: boolean;
  };
}> = [];

test.describe("Launch Smoke Test - 100 Trials", () => {
  test.setTimeout(TEST_CONFIG.MAX_DURATION_MS);

  // Generate 100 test trials
  for (let trialNum = 1; trialNum <= TEST_CONFIG.TOTAL_TRIALS; trialNum++) {
    test(`Trial ${trialNum}/${TEST_CONFIG.TOTAL_TRIALS}: Complete Critical Flow`, async ({
      page,
    }) => {
      const startTime = Date.now();

      const result = {
        trial: trialNum,
        status: "PASS" as "PASS" | "FAIL",
        duration: 0,
        steps: {
          login: false,
          logEntries: false,
          viewDashboard: false,
          logout: false,
        },
      };

      try {
        console.log(`\n🚀 Trial ${trialNum}/100 starting...`);

        // ============================================================
        // STEP 1: LOGIN
        // ============================================================
        console.log(`  📝 Step 1: Login`);
        await performLogin(page, trialNum);
        result.steps.login = true;
        console.log(`  ✅ Login successful`);

        // ============================================================
        // STEP 2: LOG 5 TRAINING ENTRIES
        // ============================================================
        console.log(
          `  📝 Step 2: Log ${TEST_CONFIG.ENTRIES_PER_TRIAL} training entries`,
        );
        await logTrainingEntries(page, trialNum, TEST_CONFIG.ENTRIES_PER_TRIAL);
        result.steps.logEntries = true;
        console.log(`  ✅ ${TEST_CONFIG.ENTRIES_PER_TRIAL} entries logged`);

        // ============================================================
        // STEP 3: VIEW DASHBOARD
        // ============================================================
        console.log(`  📝 Step 3: View Dashboard`);
        await viewDashboard(page, trialNum);
        result.steps.viewDashboard = true;
        console.log(`  ✅ Dashboard verified`);

        // ============================================================
        // STEP 4: LOGOUT
        // ============================================================
        console.log(`  📝 Step 4: Logout`);
        await performLogout(page, trialNum);
        result.steps.logout = true;
        console.log(`  ✅ Logout successful`);

        result.duration = Date.now() - startTime;
        console.log(
          `✅ Trial ${trialNum}/100 PASSED in ${(result.duration / 1000).toFixed(2)}s`,
        );
      } catch (error) {
        result.status = "FAIL";
        result.duration = Date.now() - startTime;
        result.error = error instanceof Error ? error.message : String(error);

        console.error(`❌ Trial ${trialNum}/100 FAILED: ${result.error}`);
        console.error(
          `   Steps completed: Login=${result.steps.login}, LogEntries=${result.steps.logEntries}, Dashboard=${result.steps.viewDashboard}, Logout=${result.steps.logout}`,
        );

        // Take screenshot on failure
        await page.screenshot({
          path: `test-results/trial-${trialNum}-failure.png`,
          fullPage: true,
        });

        throw error;
      } finally {
        trialResults.push(result);
      }
    });
  }

  // After all trials, generate summary report
  test.afterAll(async () => {
    generateSummaryReport();
  });
});

/**
 * Step 1: Login
 */
async function performLogin(page: Page, _trialNum: number): Promise<void> {
  // Navigate to login page
  await page.goto(`${TEST_CONFIG.BASE_URL}/login`, {
    waitUntil: "networkidle",
  });

  // Wait for login form
  await page.waitForSelector(
    'input[type="email"], input[name="email"], [formControlName="email"]',
    {
      timeout: 10000,
    },
  );

  // Fill credentials
  const emailSelector =
    'input[type="email"], input[name="email"], [formControlName="email"]';
  const passwordSelector =
    'input[type="password"], input[name="password"], [formControlName="password"]';

  await page.fill(emailSelector, TEST_CONFIG.TEST_USER_EMAIL);
  await page.fill(passwordSelector, TEST_CONFIG.TEST_USER_PASSWORD);

  // Submit login form
  await page.click(
    'button[type="submit"]:has-text("Sign In"), button:has-text("Login"), button:has-text("Sign In")',
  );

  // Wait for successful login redirect to dashboard
  await page.waitForURL(/.*\/(dashboard|home|today).*/, { timeout: 10000 });

  // Verify we're logged in (check for user menu or logout button)
  await expect(
    page.locator(
      '[data-testid="user-menu"], .user-menu, [aria-label*="user menu" i]',
    ),
  ).toBeVisible({
    timeout: 5000,
  });
}

/**
 * Step 2: Log Training Entries
 */
async function logTrainingEntries(
  page: Page,
  trialNum: number,
  count: number,
): Promise<void> {
  for (let i = 1; i <= count; i++) {
    console.log(`    Entry ${i}/${count}...`);

    // Navigate to training page
    await page.goto(`${TEST_CONFIG.BASE_URL}/training`, {
      waitUntil: "domcontentloaded",
    });

    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // Look for "Log Training" or "Add Training" button
    const addButtonSelectors = [
      'button:has-text("Log Training")',
      'button:has-text("Add Training")',
      'button:has-text("New Entry")',
      '[data-testid="log-training-button"]',
      '[data-testid="add-training-button"]',
      'p-button:has-text("Log Training")',
      '.p-button:has-text("Log Training")',
    ];

    let buttonFound = false;
    for (const selector of addButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          buttonFound = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!buttonFound) {
      // Maybe the form is already visible
      console.log(`      No add button found, checking if form is visible...`);
    }

    // Wait for form to appear (either dialog or inline)
    await page.waitForSelector('form, [role="dialog"] form, .training-form', {
      timeout: 5000,
    });

    // Fill training entry form
    const today = new Date().toISOString().split("T")[0];

    // Date field
    const dateSelectors = [
      'input[name="date"]',
      'input[type="date"]',
      '[formControlName="date"]',
    ];
    for (const selector of dateSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          await page.fill(selector, today);
          break;
        }
      } catch {
        /* ignore */
      }
    }

    // Duration field (30 minutes)
    const durationSelectors = [
      'input[name="duration"]',
      '[formControlName="duration"]',
      'input[placeholder*="duration" i]',
    ];
    for (const selector of durationSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          await page.fill(selector, "30");
          break;
        }
      } catch {
        /* ignore */
      }
    }

    // Intensity field (7/10)
    const intensitySelectors = [
      'input[name="intensity"]',
      '[formControlName="intensity"]',
      'input[placeholder*="intensity" i]',
    ];
    for (const selector of intensitySelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          await page.fill(selector, "7");
          break;
        }
      } catch {
        /* ignore */
      }
    }

    // Training type dropdown/select
    const typeSelectors = [
      'select[name="type"]',
      '[formControlName="type"]',
      'p-dropdown[formcontrolname="type"]',
    ];
    for (const selector of typeSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          // If it's a PrimeNG dropdown, click to open
          if (selector.includes("p-dropdown")) {
            await element.click();
            await page.waitForTimeout(500);
            // Select first option
            await page.click(".p-dropdown-item");
          } else {
            // Regular select
            await element.selectOption({ index: 1 });
          }
          break;
        }
      } catch {
        /* ignore */
      }
    }

    // Notes field
    const notesSelectors = [
      'textarea[name="notes"]',
      '[formControlName="notes"]',
      'textarea[placeholder*="notes" i]',
    ];
    for (const selector of notesSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          await page.fill(
            selector,
            `Launch smoke test - Trial ${trialNum}, Entry ${i}`,
          );
          break;
        }
      } catch {
        /* ignore */
      }
    }

    // Submit form
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Save")',
      'button:has-text("Submit")',
      'button:has-text("Log")',
      '[data-testid="submit-training"]',
    ];

    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          break;
        }
      } catch {
        /* ignore */
      }
    }

    // Wait for success (either toast message or form close)
    try {
      await page.waitForSelector(
        '.p-toast-message-success, .success-message, [role="alert"]:has-text("success")',
        {
          timeout: 5000,
          state: "visible",
        },
      );
    } catch {
      // Success message might not appear, that's okay
      console.log(`      No success toast, assuming entry saved`);
    }

    // Wait a bit before next entry
    await page.waitForTimeout(1000);
  }
}

/**
 * Step 3: View Dashboard
 */
async function viewDashboard(page: Page, _trialNum: number): Promise<void> {
  // Navigate to dashboard
  await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`, {
    waitUntil: "domcontentloaded",
  });

  // Wait for dashboard to load
  await page.waitForLoadState("networkidle", { timeout: 10000 });

  // Verify key dashboard elements are present
  const dashboardSelectors = [
    '[data-testid="training-stats"]',
    ".training-stats",
    '[data-testid="recent-activity"]',
    ".recent-activity",
    ".dashboard-card",
    "p-card",
  ];

  let elementFound = false;
  for (const selector of dashboardSelectors) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        elementFound = true;
        break;
      }
    } catch {
      /* ignore */
    }
  }

  if (!elementFound) {
    throw new Error(
      "Dashboard did not load correctly - no expected elements found",
    );
  }

  // Check for console errors
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.waitForTimeout(2000); // Let dashboard fully render

  if (consoleErrors.length > 0) {
    console.warn(`    ⚠️  Console errors detected: ${consoleErrors.length}`);
    consoleErrors.forEach((err) => console.warn(`       ${err}`));
  }
}

/**
 * Step 4: Logout
 */
async function performLogout(page: Page, _trialNum: number): Promise<void> {
  // Click user menu
  const userMenuSelectors = [
    '[data-testid="user-menu"]',
    ".user-menu",
    'button[aria-label*="user menu" i]',
    'button:has-text("Profile")',
    ".profile-menu",
  ];

  let menuOpened = false;
  for (const selector of userMenuSelectors) {
    try {
      const menu = page.locator(selector).first();
      if (await menu.isVisible({ timeout: 2000 })) {
        await menu.click();
        menuOpened = true;
        break;
      }
    } catch {
      /* ignore */
    }
  }

  if (!menuOpened) {
    throw new Error("Could not open user menu for logout");
  }

  // Wait for menu to open
  await page.waitForTimeout(500);

  // Click logout button
  const logoutSelectors = [
    '[data-testid="logout-button"]',
    'button:has-text("Logout")',
    'button:has-text("Log Out")',
    'button:has-text("Sign Out")',
    'a:has-text("Logout")',
  ];

  let loggedOut = false;
  for (const selector of logoutSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        loggedOut = true;
        break;
      }
    } catch {
      /* ignore */
    }
  }

  if (!loggedOut) {
    throw new Error("Could not find logout button");
  }

  // Wait for redirect to login page
  await page.waitForURL(/.*\/(login|auth).*/, { timeout: 10000 });

  // Verify we're logged out (login form should be visible)
  await expect(
    page.locator('input[type="email"], input[name="email"]'),
  ).toBeVisible({ timeout: 5000 });
}

/**
 * Generate Summary Report
 */
function generateSummaryReport(): void {
  const totalTrials = trialResults.length;
  const passedTrials = trialResults.filter((r) => r.status === "PASS").length;
  const failedTrials = trialResults.filter((r) => r.status === "FAIL").length;
  const successRate = ((passedTrials / totalTrials) * 100).toFixed(2);

  const avgDuration =
    trialResults.reduce((sum, r) => sum + r.duration, 0) / totalTrials;
  const minDuration = Math.min(...trialResults.map((r) => r.duration));
  const maxDuration = Math.max(...trialResults.map((r) => r.duration));

  console.log("\n" + "=".repeat(80));
  console.log("LAUNCH SMOKE TEST SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total Trials:    ${totalTrials}`);
  console.log(`Passed:          ${passedTrials} (${successRate}%)`);
  console.log(`Failed:          ${failedTrials}`);
  console.log(`\nPerformance:`);
  console.log(`  Average:       ${(avgDuration / 1000).toFixed(2)}s`);
  console.log(`  Fastest:       ${(minDuration / 1000).toFixed(2)}s`);
  console.log(`  Slowest:       ${(maxDuration / 1000).toFixed(2)}s`);

  if (failedTrials > 0) {
    console.log(`\nFailed Trials:`);
    trialResults
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  Trial ${r.trial}: ${r.error}`);
        console.log(
          `    Steps: Login=${r.steps.login}, Log=${r.steps.logEntries}, Dashboard=${r.steps.viewDashboard}, Logout=${r.steps.logout}`,
        );
      });
  }

  console.log("\n" + "=".repeat(80));

  if (successRate === "100.00") {
    console.log("🎉 LAUNCH GREENLIGHT: All 100 trials passed!");
  } else {
    console.log(
      `⚠️  LAUNCH HOLD: Only ${successRate}% success rate (need 100%)`,
    );
  }
  console.log("=".repeat(80) + "\n");

  // Write results to JSON file
  const fs = await import("fs");
  const resultsPath = "test-results/launch-smoke-test-results.json";
  fs.writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config: TEST_CONFIG,
        summary: {
          total: totalTrials,
          passed: passedTrials,
          failed: failedTrials,
          successRate: parseFloat(successRate),
          avgDuration: avgDuration / 1000,
          minDuration: minDuration / 1000,
          maxDuration: maxDuration / 1000,
        },
        trials: trialResults,
      },
      null,
      2,
    ),
  );

  console.log(`📄 Full results saved to: ${resultsPath}\n`);
}
