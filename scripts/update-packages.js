#!/usr/bin/env node

/**
 * Package Update Script
 * Safely updates packages based on priority levels
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, cwd = rootDir) {
  try {
    return execSync(command, { cwd, stdio: "inherit", encoding: "utf-8" });
  } catch (error) {
    log(`Error executing: ${command}`, "red");
    throw error;
  }
}

async function updateSecurityPatches() {
  log("\n🔒 Phase 1: Security & Critical Patches", "cyan");
  log("=".repeat(50), "cyan");

  log("\n📦 Updating root package security patches...", "blue");
  exec(
    "npm update netlify-cli @supabase/supabase-js jsonwebtoken nodemailer chart.js",
  );

  log("\n📦 Updating Angular package patches...", "blue");
  const angularDir = join(rootDir, "angular");
  // Use npm update to update within semver ranges (^19.0.0 allows up to 19.x.x)
  // This will update all Angular packages to latest patch versions
  exec("npm update", angularDir);

  log("\n✅ Security patches updated!", "green");
}

async function auditSecurity() {
  log("\n🔍 Running security audit...", "cyan");
  try {
    exec("npm audit --audit-level=moderate");
    log("✅ Security audit completed", "green");
  } catch (error) {
    log("⚠️  Security vulnerabilities found. Run: npm audit fix", "yellow");
  }
}

async function checkOutdated() {
  log("\n📊 Checking for outdated packages...", "cyan");
  try {
    exec("npm outdated", rootDir);
    exec("npm outdated", join(rootDir, "angular"));
  } catch (error) {
    // npm outdated exits with code 1 if packages are outdated (expected)
    log(
      "ℹ️  Some packages are outdated. See UPDATE_REPORT.md for details.",
      "yellow",
    );
  }
}

async function runTests() {
  log("\n🧪 Running tests...", "cyan");
  try {
    exec("npm test");
    log("✅ Tests passed!", "green");
  } catch (error) {
    log("⚠️  Some tests failed. Please review.", "yellow");
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "safe";

  log("\n🚀 Package Update Script", "cyan");
  log("=".repeat(50), "cyan");

  if (mode === "safe" || mode === "security") {
    await updateSecurityPatches();
    await auditSecurity();
  } else if (mode === "check") {
    await checkOutdated();
  } else if (mode === "test") {
    await runTests();
  } else if (mode === "all") {
    await updateSecurityPatches();
    await auditSecurity();
    await checkOutdated();
    await runTests();
  } else {
    log("\nUsage:", "yellow");
    log("  node scripts/update-packages.js [mode]", "yellow");
    log("\nModes:", "yellow");
    log("  safe     - Update security patches only (default)", "yellow");
    log("  security - Same as safe", "yellow");
    log("  check    - Check for outdated packages", "yellow");
    log("  test     - Run test suite", "yellow");
    log("  all      - Run all updates, audit, and tests", "yellow");
    process.exit(1);
  }

  log("\n✅ Update process completed!", "green");
  log("\n📋 Next steps:", "cyan");
  log("  1. Review UPDATE_REPORT.md for major updates", "cyan");
  log("  2. Test your application thoroughly", "cyan");
  log("  3. Consider Angular 21 migration (see report)", "cyan");
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  process.exit(1);
});
