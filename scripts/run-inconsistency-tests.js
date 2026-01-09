#!/usr/bin/env node

/**
 * Inconsistency Test Runner
 *
 * Runs three types of inconsistency tests:
 * 1. Backend + Frontend Integration Inconsistencies
 * 2. UI Design System Inconsistencies
 * 3. UX Inconsistencies
 *
 * Usage: node scripts/run-inconsistency-tests.js
 */

import { spawn } from "child_process";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const results = {
  backendFrontend: {
    status: "pending",
    tests: 0,
    passed: 0,
    failed: 0,
    errors: [],
  },
  designSystem: {
    status: "pending",
    tests: 0,
    passed: 0,
    failed: 0,
    errors: [],
  },
  ux: { status: "pending", tests: 0, passed: 0, failed: 0, errors: [] },
  timestamp: new Date().toISOString(),
};

function runCommand(command, args, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Running: ${description}`);
    console.log(`   Command: ${command} ${args.join(" ")}`);
    console.log(`   Directory: ${cwd}\n`);

    const process = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
      try {
        process.stdout.write(data);
      } catch (e) {
        // Ignore EPIPE errors
      }
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
      try {
        process.stderr.write(data);
      } catch (e) {
        // Ignore EPIPE errors
      }
    });

    process.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

async function runBackendFrontendTests() {
  try {
    console.log(
      "\n═══════════════════════════════════════════════════════════",
    );
    console.log("TEST 1: Backend + Frontend Integration Inconsistencies");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    const { code, stdout, stderr } = await runCommand(
      "npx",
      [
        "vitest",
        "run",
        "tests/integration/api-integration.test.js",
        "--reporter=verbose",
      ],
      rootDir,
      "Backend/Frontend Integration Tests",
    );

    // Parse test results
    const output = stdout + stderr;
    // Match patterns like "Tests  21 passed (21)" or "Tests  9 failed | 21 passed (30)"
    const testMatch = output.match(/Tests\s+(\d+)\s+passed/);
    const failedMatch = output.match(/Tests\s+(\d+)\s+failed/);
    const totalMatch = output.match(
      /Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/,
    );

    results.backendFrontend.status = code === 0 ? "passed" : "failed";

    if (totalMatch) {
      // Format: "Tests  9 failed | 21 passed (30)"
      results.backendFrontend.failed = parseInt(totalMatch[1]);
      results.backendFrontend.passed = parseInt(totalMatch[2]);
      results.backendFrontend.tests = parseInt(totalMatch[3]);
    } else {
      results.backendFrontend.passed = testMatch ? parseInt(testMatch[1]) : 0;
      results.backendFrontend.failed = failedMatch
        ? parseInt(failedMatch[1])
        : 0;
      results.backendFrontend.tests =
        results.backendFrontend.passed + results.backendFrontend.failed;
    }

    if (code !== 0) {
      // Extract error messages
      const errorLines = output
        .split("\n")
        .filter(
          (line) =>
            line.includes("FAIL") ||
            line.includes("Error") ||
            line.includes("TypeError") ||
            line.includes("AssertionError"),
        );
      results.backendFrontend.errors = errorLines.slice(0, 10);
    }

    return code === 0;
  } catch (error) {
    results.backendFrontend.status = "error";
    results.backendFrontend.errors = [error.message];
    console.error(`❌ Error running backend/frontend tests: ${error.message}`);
    return false;
  }
}

async function runDesignSystemTests() {
  try {
    console.log(
      "\n═══════════════════════════════════════════════════════════",
    );
    console.log("TEST 2: UI Design System Inconsistencies");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    // Check if server is running
    const serverCheck = await runCommand(
      "curl",
      ["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:4200"],
      rootDir,
      "Checking if Angular server is running",
    );

    const serverRunning = serverCheck.stdout.trim() === "200";

    if (!serverRunning) {
      console.log(
        "⚠️  Angular server is not running. Design system tests require the server.",
      );
      console.log(
        "   To run these tests, start the server with: npm run dev:angular",
      );
      console.log("   Then run: cd angular && npm run e2e:design-system\n");

      results.designSystem.status = "skipped";
      results.designSystem.errors = ["Angular server not running"];
      return false;
    }

    const { code, stdout, stderr } = await runCommand(
      "npx",
      [
        "playwright",
        "test",
        "e2e/design-system-compliance.spec.ts",
        "--reporter=list",
      ],
      join(rootDir, "angular"),
      "Design System Compliance Tests",
    );

    const output = stdout + stderr;
    const testMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);

    results.designSystem.status = code === 0 ? "passed" : "failed";
    results.designSystem.passed = testMatch ? parseInt(testMatch[1]) : 0;
    results.designSystem.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    results.designSystem.tests =
      results.designSystem.passed + results.designSystem.failed;

    if (code !== 0) {
      const errorLines = output
        .split("\n")
        .filter(
          (line) =>
            line.includes("FAIL") ||
            line.includes("Error") ||
            line.includes("expect") ||
            line.includes("Violation"),
        );
      results.designSystem.errors = errorLines.slice(0, 10);
    }

    return code === 0;
  } catch (error) {
    results.designSystem.status = "error";
    results.designSystem.errors = [error.message];
    console.error(`❌ Error running design system tests: ${error.message}`);
    return false;
  }
}

async function runUXTests() {
  try {
    console.log(
      "\n═══════════════════════════════════════════════════════════",
    );
    console.log("TEST 3: UX Inconsistencies");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    // Check if server is running
    const serverCheck = await runCommand(
      "curl",
      ["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:4200"],
      rootDir,
      "Checking if Angular server is running",
    );

    const serverRunning = serverCheck.stdout.trim() === "200";

    if (!serverRunning) {
      console.log(
        "⚠️  Angular server is not running. UX tests require the server.",
      );
      console.log(
        "   To run these tests, start the server with: npm run dev:angular",
      );
      console.log(
        "   Then run: cd angular && npx playwright test e2e/ux-inconsistencies.spec.ts\n",
      );

      results.ux.status = "skipped";
      results.ux.errors = ["Angular server not running"];
      return false;
    }

    const { code, stdout, stderr } = await runCommand(
      "npx",
      [
        "playwright",
        "test",
        "e2e/ux-inconsistencies.spec.ts",
        "--reporter=list",
      ],
      join(rootDir, "angular"),
      "UX Inconsistencies Tests",
    );

    const output = stdout + stderr;
    const testMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);

    results.ux.status = code === 0 ? "passed" : "failed";
    results.ux.passed = testMatch ? parseInt(testMatch[1]) : 0;
    results.ux.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    results.ux.tests = results.ux.passed + results.ux.failed;

    if (code !== 0) {
      const errorLines = output
        .split("\n")
        .filter(
          (line) =>
            line.includes("FAIL") ||
            line.includes("Error") ||
            line.includes("expect") ||
            line.includes("Inconsistency"),
        );
      results.ux.errors = errorLines.slice(0, 10);
    }

    return code === 0;
  } catch (error) {
    results.ux.status = "error";
    results.ux.errors = [error.message];
    console.error(`❌ Error running UX tests: ${error.message}`);
    return false;
  }
}

function generateReport() {
  console.log(
    "\n\n═══════════════════════════════════════════════════════════",
  );
  console.log("INCONSISTENCY TEST RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  const report = {
    summary: {
      timestamp: results.timestamp,
      totalTests:
        results.backendFrontend.tests +
        results.designSystem.tests +
        results.ux.tests,
      totalPassed:
        results.backendFrontend.passed +
        results.designSystem.passed +
        results.ux.passed,
      totalFailed:
        results.backendFrontend.failed +
        results.designSystem.failed +
        results.ux.failed,
    },
    tests: {
      backendFrontend: results.backendFrontend,
      designSystem: results.designSystem,
      ux: results.ux,
    },
  };

  // Print summary
  console.log("📊 SUMMARY:");
  console.log(`   Total Tests: ${report.summary.totalTests}`);
  console.log(`   ✅ Passed: ${report.summary.totalPassed}`);
  console.log(`   ❌ Failed: ${report.summary.totalFailed}`);
  console.log(
    `   ⏭️  Skipped: ${[results.backendFrontend, results.designSystem, results.ux].filter((r) => r.status === "skipped").length}\n`,
  );

  console.log("📋 DETAILED RESULTS:\n");

  // Backend/Frontend
  console.log("1. Backend + Frontend Integration Inconsistencies:");
  console.log(
    `   Status: ${results.backendFrontend.status === "passed" ? "✅ PASSED" : results.backendFrontend.status === "skipped" ? "⏭️  SKIPPED" : "❌ FAILED"}`,
  );
  console.log(
    `   Tests: ${results.backendFrontend.tests} (${results.backendFrontend.passed} passed, ${results.backendFrontend.failed} failed)`,
  );
  if (results.backendFrontend.errors.length > 0) {
    console.log(`   Errors: ${results.backendFrontend.errors.length}`);
    results.backendFrontend.errors
      .slice(0, 3)
      .forEach((err) => console.log(`     - ${err}`));
  }
  console.log("");

  // Design System
  console.log("2. UI Design System Inconsistencies:");
  console.log(
    `   Status: ${results.designSystem.status === "passed" ? "✅ PASSED" : results.designSystem.status === "skipped" ? "⏭️  SKIPPED" : "❌ FAILED"}`,
  );
  console.log(
    `   Tests: ${results.designSystem.tests} (${results.designSystem.passed} passed, ${results.designSystem.failed} failed)`,
  );
  if (results.designSystem.errors.length > 0) {
    console.log(`   Errors: ${results.designSystem.errors.length}`);
    results.designSystem.errors
      .slice(0, 3)
      .forEach((err) => console.log(`     - ${err}`));
  }
  console.log("");

  // UX
  console.log("3. UX Inconsistencies:");
  console.log(
    `   Status: ${results.ux.status === "passed" ? "✅ PASSED" : results.ux.status === "skipped" ? "⏭️  SKIPPED" : "❌ FAILED"}`,
  );
  console.log(
    `   Tests: ${results.ux.tests} (${results.ux.passed} passed, ${results.ux.failed} failed)`,
  );
  if (results.ux.errors.length > 0) {
    console.log(`   Errors: ${results.ux.errors.length}`);
    results.ux.errors
      .slice(0, 3)
      .forEach((err) => console.log(`     - ${err}`));
  }
  console.log("");

  // Save report to file
  const reportPath = join(rootDir, "INCONSISTENCY_TEST_REPORT.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);

  return (
    report.summary.totalFailed === 0 &&
    results.designSystem.status !== "skipped" &&
    results.ux.status !== "skipped"
  );
}

async function main() {
  console.log("🚀 Starting Inconsistency Tests...\n");

  await runBackendFrontendTests();
  await runDesignSystemTests();
  await runUXTests();

  const allPassed = generateReport();

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
