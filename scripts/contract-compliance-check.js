#!/usr/bin/env node

/**
 * Contract Compliance Checker
 *
 * Runs automated checks against codebase to verify contract compliance.
 * Checks:
 * 1. Database schema compliance
 * 2. API endpoint compliance
 * 3. Code pattern compliance
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTS_DIR = path.join(__dirname, "../docs/contracts");
const CODEBASE_ROOT = path.join(__dirname, "..");

// Color output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDatabaseSchema() {
  log("\n=== Database Schema Compliance ===", "blue");

  const checks = [
    {
      name: "coach_locked column exists",
      pattern: /coach_locked.*BOOLEAN/i,
      files: ["supabase/migrations/**/*.sql"],
      status: "pending",
    },
    {
      name: "session_state enum constraint",
      pattern: /session_state.*CHECK.*\(/i,
      files: ["supabase/migrations/**/*.sql"],
      status: "pending",
    },
    {
      name: "modified_by_coach_id column exists",
      pattern: /modified_by_coach_id/i,
      files: ["supabase/migrations/**/*.sql"],
      status: "pending",
    },
    {
      name: "athlete_consent_settings table exists",
      pattern: /CREATE TABLE.*athlete_consent_settings/i,
      files: ["supabase/migrations/**/*.sql"],
      status: "pending",
    },
  ];

  checks.forEach((check) => {
    try {
      const result = execSync(
        `grep -r "${check.pattern.source}" ${CODEBASE_ROOT}/${check.files[0]} 2>/dev/null || true`,
        { encoding: "utf-8" },
      );
      if (result.trim()) {
        log(`  ✅ ${check.name}`, "green");
        check.status = "pass";
      } else {
        log(`  ❌ ${check.name}`, "red");
        check.status = "fail";
      }
    } catch (error) {
      log(`  ⚠️  ${check.name} (check failed)`, "yellow");
      check.status = "error";
    }
  });

  return checks;
}

function checkAPIGuards() {
  log("\n=== API Guard Compliance ===", "blue");

  const checks = [
    {
      name: "authorization-guard.js exists",
      file: "netlify/functions/utils/authorization-guard.js",
      status: "pending",
    },
    {
      name: "consent-guard.js exists",
      file: "netlify/functions/utils/consent-guard.js",
      status: "pending",
    },
    {
      name: "coach_locked check in guard",
      pattern: /coach_locked/i,
      file: "netlify/functions/utils/authorization-guard.js",
      status: "pending",
    },
    {
      name: "session_state check in guard",
      pattern: /session_state/i,
      file: "netlify/functions/utils/authorization-guard.js",
      status: "pending",
    },
  ];

  checks.forEach((check) => {
    const filePath = path.join(CODEBASE_ROOT, check.file);
    if (fs.existsSync(filePath)) {
      if (check.pattern) {
        const content = fs.readFileSync(filePath, "utf-8");
        if (check.pattern.test(content)) {
          log(`  ✅ ${check.name}`, "green");
          check.status = "pass";
        } else {
          log(`  ❌ ${check.name}`, "red");
          check.status = "fail";
        }
      } else {
        log(`  ✅ ${check.name}`, "green");
        check.status = "pass";
      }
    } else {
      log(`  ❌ ${check.name}`, "red");
      check.status = "fail";
    }
  });

  return checks;
}

function checkCodePatterns() {
  log("\n=== Code Pattern Compliance ===", "blue");

  const checks = [
    {
      name: "No direct Supabase writes in frontend",
      pattern: /\.from\(['"]training_sessions['"]\)\.(insert|update|upsert)\(/i,
      files: ["angular/src/**/*.ts"],
      shouldExist: false,
      status: "pending",
    },
    {
      name: "Consent checks before coach data access",
      pattern: /canCoachViewReadiness|canCoachViewWellness|ConsentDataReader/i,
      files: ["netlify/functions/**/*.js"],
      shouldExist: true,
      status: "pending",
    },
    {
      name: "State transition history table exists",
      pattern: /state_transition_history/i,
      files: ["supabase/migrations/**/*.sql"],
      shouldExist: true,
      status: "pending",
    },
    {
      name: "Session state helper exists",
      pattern: /session-state-helper/i,
      files: ["netlify/functions/utils/**/*.js"],
      shouldExist: true,
      status: "pending",
    },
  ];

  checks.forEach((check) => {
    try {
      const result = execSync(
        `grep -r "${check.pattern.source}" ${CODEBASE_ROOT}/${check.files[0]} 2>/dev/null || true`,
        { encoding: "utf-8" },
      );
      const found = result.trim().length > 0;

      if (found === check.shouldExist) {
        log(`  ✅ ${check.name}`, "green");
        check.status = "pass";
      } else {
        log(`  ❌ ${check.name}`, "red");
        check.status = "fail";
      }
    } catch (error) {
      log(`  ⚠️  ${check.name} (check failed)`, "yellow");
      check.status = "error";
    }
  });

  // Check for consent violations: coach endpoints directly querying sensitive tables
  log("\n=== Consent Violation Detection ===", "blue");
  const consentViolations = [
    {
      name: "Coach endpoints using ConsentDataReader",
      pattern: /ConsentDataReader|consentReader/i,
      files: ["netlify/functions/coach.js"],
      shouldExist: true,
      status: "pending",
    },
  ];

  consentViolations.forEach((check) => {
    try {
      const filePath = path.join(CODEBASE_ROOT, check.files[0]);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const found = check.pattern.test(content);
        if (found === check.shouldExist) {
          log(`  ✅ ${check.name}`, "green");
          check.status = "pass";
        } else {
          log(`  ❌ ${check.name}`, "red");
          check.status = "fail";
        }
      } else {
        log(`  ⚠️  ${check.name} (file not found)`, "yellow");
        check.status = "error";
      }
    } catch (error) {
      log(`  ⚠️  ${check.name} (check failed)`, "yellow");
      check.status = "error";
    }
  });

  return [...checks, ...consentViolations];
}

function checkTestCoverage() {
  log("\n=== Test Coverage ===", "blue");

  const testFiles = [
    "tests/contracts/session-lifecycle-immutability.test.js",
    "tests/contracts/data-consent-visibility.test.js",
    "tests/contracts/today-screen-ux.test.js",
  ];

  const checks = testFiles.map((file) => {
    const filePath = path.join(CODEBASE_ROOT, file);
    const exists = fs.existsSync(filePath);
    if (exists) {
      log(`  ✅ ${file}`, "green");
      return { file, status: "pass" };
    } else {
      log(`  ❌ ${file}`, "red");
      return { file, status: "fail" };
    }
  });

  return checks;
}

function generateReport(dbChecks, apiChecks, patternChecks, testChecks) {
  log("\n=== Compliance Report ===", "blue");

  const totalChecks =
    dbChecks.length +
    apiChecks.length +
    patternChecks.length +
    testChecks.length;
  const passedChecks = [
    ...dbChecks,
    ...apiChecks,
    ...patternChecks,
    ...testChecks,
  ].filter((c) => c.status === "pass").length;

  const passRate = ((passedChecks / totalChecks) * 100).toFixed(1);

  log(`\nTotal Checks: ${totalChecks}`, "blue");
  log(`Passed: ${passedChecks}`, "green");
  log(`Failed: ${totalChecks - passedChecks}`, "red");
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? "green" : "yellow");

  // Write report to file
  const reportPath = path.join(
    CODEBASE_ROOT,
    "docs/contracts/COMPLIANCE_REPORT.json",
  );
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalChecks,
      passed: passedChecks,
      failed: totalChecks - passedChecks,
      passRate: parseFloat(passRate),
    },
    checks: {
      database: dbChecks,
      api: apiChecks,
      patterns: patternChecks,
      tests: testChecks,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nReport saved to: ${reportPath}`, "blue");
}

function main() {
  log("Contract Compliance Checker", "blue");
  log("============================\n", "blue");

  const dbChecks = checkDatabaseSchema();
  const apiChecks = checkAPIGuards();
  const patternChecks = checkCodePatterns();
  const testChecks = checkTestCoverage();

  generateReport(dbChecks, apiChecks, patternChecks, testChecks);
}

main();

export { main };
