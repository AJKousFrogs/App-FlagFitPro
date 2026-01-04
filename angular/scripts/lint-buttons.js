#!/usr/bin/env node

/**
 * Button Standardization Linter
 *
 * This script scans Angular components for non-standard button usage and reports violations.
 * Run as part of CI/CD or pre-commit hooks to prevent regression.
 *
 * Usage:
 *   node scripts/lint-buttons.js                    # Scan all files
 *   node scripts/lint-buttons.js --fix              # Show fix suggestions
 *   node scripts/lint-buttons.js --strict           # Fail on any violation
 *   node scripts/lint-buttons.js src/app/features   # Scan specific directory
 *
 * Exit codes:
 *   0 - No violations found (or only whitelisted)
 *   1 - Violations found
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Files/directories that are allowed to use raw buttons
  whitelistedPaths: [
    // Rich text editor needs raw buttons for toolbar
    "rich-text/rich-text.component.ts",
    // Storybook stories can show legacy patterns
    ".stories.ts",
    // Third-party integrations
    "third-party/",
    // Button component itself uses native button
    "button/button.component.ts",
    "button/icon-button.component.ts",
    // Aria components may need raw buttons
    "aria/aria-button.component.ts",
  ],

  // Patterns to detect
  patterns: [
    {
      name: "p-button element",
      regex: /<p-button\b/g,
      severity: "error",
      message: "Use <app-button> instead of <p-button>",
      fix: "Replace with <app-button variant=\"...\">"
    },
    {
      name: "pButton directive",
      regex: /\bpButton\b/g,
      severity: "error",
      message: "Use <app-button> instead of pButton directive",
      fix: "Replace button with <app-button>"
    },
    {
      name: "native button (unwhitelisted)",
      regex: /<button\b(?![^>]*data-raw-button="allowed")/g,
      severity: "warning",
      message: "Consider using <app-button> instead of native <button>",
      fix: "Replace with <app-button> or add data-raw-button=\"allowed\" if raw button is required"
    },
    {
      name: "ButtonModule import (potential cleanup)",
      regex: /import\s*{[^}]*ButtonModule[^}]*}\s*from\s*['"]primeng\/button['"]/g,
      severity: "info",
      message: "ButtonModule may no longer be needed after migration",
      fix: "Remove ButtonModule import if no longer using <p-button> directly"
    },
    {
      name: "p-button class usage",
      regex: /class="[^"]*p-button[^"]*"/g,
      severity: "warning",
      message: "Avoid using PrimeNG p-button classes directly",
      fix: "Use <app-button> variant prop instead of raw classes"
    },
    {
      name: "styleClass p-button",
      regex: /styleClass="[^"]*p-button[^"]*"/g,
      severity: "warning",
      message: "PrimeNG styleClass with p-button detected",
      fix: "Use <app-button> variant prop instead"
    }
  ],

  // File extensions to scan
  extensions: [".ts", ".html"],

  // Directories to skip
  skipDirs: ["node_modules", "dist", ".angular", "coverage", ".storybook"],
};

// ============================================
// HELPERS
// ============================================

function isWhitelisted(filePath) {
  return CONFIG.whitelistedPaths.some((wp) => filePath.includes(wp));
}

function scanFile(filePath, content) {
  const violations = [];
  const lines = content.split("\n");

  for (const pattern of CONFIG.patterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split("\n").length;
      const lineContent = lines[lineNumber - 1] || "";

      violations.push({
        file: filePath,
        line: lineNumber,
        column: match.index - beforeMatch.lastIndexOf("\n"),
        pattern: pattern.name,
        severity: pattern.severity,
        message: pattern.message,
        fix: pattern.fix,
        snippet: lineContent.trim().substring(0, 100),
      });
    }
  }

  return violations;
}

function scanDirectory(dir, baseDir) {
  const results = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = relative(baseDir, fullPath);

    // Skip configured directories
    if (CONFIG.skipDirs.some((skip) => entry === skip || relativePath.includes(skip))) {
      continue;
    }

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (stat.isFile() && CONFIG.extensions.some((ext) => entry.endsWith(ext))) {
      // Check if whitelisted
      if (isWhitelisted(relativePath)) {
        continue;
      }

      try {
        const content = readFileSync(fullPath, "utf8");
        const violations = scanFile(relativePath, content);
        results.push(...violations);
      } catch (error) {
        console.error(`Error reading ${fullPath}: ${error.message}`);
      }
    }
  }

  return results;
}

function formatOutput(violations, showFix = false) {
  const grouped = {};

  for (const v of violations) {
    if (!grouped[v.file]) {
      grouped[v.file] = [];
    }
    grouped[v.file].push(v);
  }

  let output = "";

  for (const [file, fileViolations] of Object.entries(grouped)) {
    output += `\n\x1b[1m${file}\x1b[0m\n`;

    for (const v of fileViolations) {
      const severityColor =
        v.severity === "error" ? "\x1b[31m" : v.severity === "warning" ? "\x1b[33m" : "\x1b[36m";

      output += `  ${severityColor}${v.severity}\x1b[0m  Line ${v.line}: ${v.message}\n`;
      output += `         \x1b[90m${v.snippet}\x1b[0m\n`;

      if (showFix) {
        output += `         \x1b[32m→ Fix: ${v.fix}\x1b[0m\n`;
      }
    }
  }

  return output;
}

function printSummary(violations) {
  const errors = violations.filter((v) => v.severity === "error").length;
  const warnings = violations.filter((v) => v.severity === "warning").length;
  const infos = violations.filter((v) => v.severity === "info").length;

  console.log("\n" + "=".repeat(60));
  console.log("\x1b[1mButton Standardization Report\x1b[0m");
  console.log("=".repeat(60));

  if (violations.length === 0) {
    console.log("\n\x1b[32m✓ No button standardization violations found!\x1b[0m\n");
    return;
  }

  console.log(`\n  \x1b[31m${errors} error(s)\x1b[0m`);
  console.log(`  \x1b[33m${warnings} warning(s)\x1b[0m`);
  console.log(`  \x1b[36m${infos} info(s)\x1b[0m`);
  console.log(`\n  Total: ${violations.length} violation(s) in ${new Set(violations.map((v) => v.file)).size} file(s)\n`);
}

// ============================================
// MAIN
// ============================================

function main() {
  const args = process.argv.slice(2);
  const showFix = args.includes("--fix");
  const strict = args.includes("--strict");

  // Find target directory
  let targetDir = join(__dirname, "..", "src", "app");
  for (const arg of args) {
    if (!arg.startsWith("--") && !arg.startsWith("-")) {
      targetDir = join(__dirname, "..", arg);
      break;
    }
  }

  console.log(`\nScanning: ${targetDir}\n`);

  const violations = scanDirectory(targetDir, targetDir);

  if (violations.length > 0) {
    console.log(formatOutput(violations, showFix));
  }

  printSummary(violations);

  // Migration progress
  const pButtonCount = violations.filter((v) => v.pattern === "p-button element").length;
  const pButtonDirectiveCount = violations.filter((v) => v.pattern === "pButton directive").length;
  const nativeButtonCount = violations.filter((v) => v.pattern === "native button (unwhitelisted)").length;

  if (violations.length > 0) {
    console.log("\x1b[1mMigration Progress:\x1b[0m");
    console.log(`  <p-button> remaining: ${pButtonCount}`);
    console.log(`  pButton directive remaining: ${pButtonDirectiveCount}`);
    console.log(`  Native <button> to review: ${nativeButtonCount}`);
    console.log("\n  Run with --fix to see suggested fixes.\n");
  }

  // Exit with error code if strict mode and there are errors
  const errorCount = violations.filter((v) => v.severity === "error").length;
  if (strict && errorCount > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main();
