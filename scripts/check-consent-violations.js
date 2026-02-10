#!/usr/bin/env node
/**
 * Consent Violation Checker
 *
 * CI/CD enforcement script that detects forbidden direct table access patterns
 * in coach-facing backend functions.
 *
 * POLICY: "All coach-facing performance access must go through consent views"
 *
 * Usage:
 *   node scripts/check-consent-violations.js           # Report only
 *   node scripts/check-consent-violations.js --strict  # Fail on violations
 *   node scripts/check-consent-violations.js --fix     # Show fix suggestions
 *   node scripts/check-consent-violations.js --ci      # CI mode (JSON output)
 *
 * @see docs/SAFETY_ACCESS_LAYER.md
 */

import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

const CONFIG = {
  protectedTables: [
    "workout_logs",
    "load_monitoring",
    "training_load_metrics",
    "metric_entries",
    "training_sessions",
    "wellness_entries",
    "wellness_logs",
  ],
  consentViews: {
    workout_logs: "v_workout_logs_consent",
    load_monitoring: "v_load_monitoring_consent",
  },
  scanPaths: ["netlify/functions/**/*.js"],
  excludePatterns: [
    "**/node_modules/**",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.test.js",
    "**/consent-data-reader.js",
    "**/check-consent-violations.js",
    "**/check-consent-violations.js",
    "**/data-state.js",
    "**/verify-db-objects.js",
    "**/verify-db-objects.js",
  ],
  coachContextIndicators: [
    /coach/i,
    /team.*dashboard/i,
    /squad/i,
    /player.*analytics/i,
    /team.*analytics/i,
    /getTeam/i,
    /getCoach/i,
  ],
  allowedExceptions: [
    { file: "supabase-client.js", reason: "Database client initialization and helper functions" },
    { file: "training-sessions.js", reason: "Player-only: user accesses own training sessions" },
    { file: "training-complete.js", reason: "Player-only: user completes own training session" },
    { file: "daily-training.js", reason: "Player-only: user accesses own daily training" },
    { file: "user-context.js", reason: "Player-only: user accesses own context data" },
    { file: "dashboard.js", reason: "Player-only: user accesses own dashboard" },
    { file: "ai-chat.js", reason: "Player-only: AI uses player own data for coaching" },
    { file: "training-suggestions.js", reason: "Player-only: user gets own training suggestions" },
    { file: "training-stats-enhanced.js", reason: "Player-only: user accesses own training stats" },
    { file: "training-plan.js", reason: "Player-only: user accesses own training plan" },
    { file: "smart-training-recommendations.js", reason: "Player-only: user gets own AI recommendations" },
    { file: "recovery.js", reason: "Player-only: user accesses own recovery data" },
    { file: "performance-metrics.js", reason: "Player-only: user accesses own performance metrics" },
    { file: "performance-heatmap.js", reason: "Player-only: user accesses own performance heatmap" },
    { file: "nutrition.js", reason: "Player-only: user accesses own nutrition data" },
    { file: "load-management.js", reason: "Player-only: user accesses own load management data" },
    { file: "calc-readiness.js", reason: "Player-only: user calculates own readiness score" },
  ],
};

class ConsentViolationChecker {
  constructor(options = {}) {
    this.strict = options.strict || false;
    this.showFix = options.fix || false;
    this.ciMode = options.ci || false;
    this.violations = [];
    this.warnings = [];
    this.scannedFiles = 0;
  }

  async run() {
    console.log("🔍 Consent Violation Checker\n");
    console.log('Policy: "All coach-facing performance access must go through consent views"\n');
    console.log(`${"=".repeat(70)}\n`);

    const files = await this.getFilesToScan();
    console.log(`Scanning ${files.length} files...\n`);

    for (const file of files) {
      await this.scanFile(file);
    }

    this.printResults();

    if (this.strict && this.violations.length > 0) {
      return 1;
    }
    return 0;
  }

  async getFilesToScan() {
    const allFiles = [];
    for (const pattern of CONFIG.scanPaths) {
      const matches = await glob(pattern, {
        ignore: CONFIG.excludePatterns,
        cwd: process.cwd(),
      });
      allFiles.push(...matches);
    }
    return [...new Set(allFiles)];
  }

  async scanFile(filePath) {
    this.scannedFiles++;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const fileName = path.basename(filePath);
      const exception = CONFIG.allowedExceptions.find((e) => fileName.includes(e.file));
      const tableViolations = this.detectDirectTableAccess(content, filePath);
      const isCoachContext = this.isCoachContextFile(content, filePath);

      for (const violation of tableViolations) {
        if (exception) {
          if (exception.requiresReview) {
            this.warnings.push({ ...violation, isException: true, exceptionReason: exception.reason });
          }
        } else if (isCoachContext) {
          this.violations.push({ ...violation, isCoachContext: true, severity: "error" });
        } else {
          this.warnings.push({ ...violation, isCoachContext: false, severity: "warning" });
        }
      }
    } catch (err) {
      console.warn(`  ⚠️  Could not read ${filePath}: ${err.message}`);
    }
  }

  detectDirectTableAccess(content, filePath) {
    const violations = [];
    const lines = content.split("\n");
    const fromPattern = /\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const writeOperationPatterns = [/\.insert\s*\(/, /\.update\s*\(/, /\.upsert\s*\(/, /\.delete\s*\(/];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      let match;
      fromPattern.lastIndex = 0;

      while ((match = fromPattern.exec(line)) !== null) {
        const tableName = match[1].toLowerCase();
        if (!CONFIG.protectedTables.includes(tableName)) {
          continue;
        }
        const remainingLine = line.substring(match.index);
        const nextLines = lines.slice(lineNum, lineNum + 5).join("\n");
        const isWriteOperation = writeOperationPatterns.some(
          (p) => p.test(remainingLine) || p.test(nextLines),
        );
        if (isWriteOperation) {
          continue;
        }
        const consentView = CONFIG.consentViews[tableName];
        violations.push({
          file: filePath,
          line: lineNum + 1,
          column: match.index + 1,
          table: tableName,
          code: line.trim(),
          message: `Direct access to protected table '${tableName}'`,
          suggestion: consentView ? `Use '${consentView}' view or ConsentDataReader` : "Use ConsentDataReader for consent-aware access",
        });
      }
    }
    return violations;
  }

  isCoachContextFile(content, filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    const playerOwnDataServices = [
      "wellness.service.ts",
      "acwr.service.ts",
      "training-data.service.ts",
      "recovery.service.ts",
      "performance-data.service.ts",
      "training-safety.service.ts",
      "data-export.service.ts",
    ];
    if (playerOwnDataServices.some((svc) => fileName.includes(svc))) {
      return false;
    }
    const playerOwnDataComponents = [
      "workout.component.ts",
      "training.component.ts",
      "profile.component.ts",
      "training-builder.component.ts",
      "training-schedule.component.ts",
      "training-safety.component.ts",
      "smart-training-form.component.ts",
      "ai-training-scheduler.component.ts",
      "enhanced-analytics.component.ts",
    ];
    if (playerOwnDataComponents.some((cmp) => fileName.includes(cmp))) {
      return false;
    }
    if (fileName.includes("coach")) {
      return true;
    }
    for (const pattern of CONFIG.coachContextIndicators) {
      if (pattern.test(content)) {
        return true;
      }
    }
    const coachFunctionPatterns = [
      /function\s+\w*[Cc]oach\w*/,
      /async\s+\w*[Cc]oach\w*/,
      /const\s+\w*[Cc]oach\w*\s*=/,
      /getTeamMembers/i,
      /getSquad/i,
    ];
    for (const pattern of coachFunctionPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
    return false;
  }

  printResults() {
    console.log("=".repeat(70));
    console.log("\n📊 RESULTS\n");
    console.log(`   Files scanned:  ${this.scannedFiles}`);
    console.log(`   ❌ Violations:  ${this.violations.length}`);
    console.log(`   ⚠️  Warnings:    ${this.warnings.length}`);
    console.log();

    if (this.violations.length > 0) {
      console.log("❌ VIOLATIONS (Coach-Context Direct Table Access)\n");
      for (const v of this.violations) {
        console.log(`   ${v.file}:${v.line}:${v.column}`);
        console.log(`   Table: ${v.table}`);
        console.log(`   Code:  ${v.code}`);
        console.log(`   ${v.message}`);
        if (this.showFix && v.suggestion) {
          console.log(`   💡 Fix: ${v.suggestion}`);
        }
        console.log();
      }
    }

    if (this.warnings.length > 0 && !this.ciMode) {
      console.log("⚠️  WARNINGS (Non-Coach Context or Exceptions)\n");
      for (const w of this.warnings) {
        console.log(`   ${w.file}:${w.line}`);
        console.log(`   Table: ${w.table}`);
        if (w.isException) {
          console.log(`   Exception: ${w.exceptionReason}`);
        }
        console.log();
      }
    }

    if (this.violations.length === 0) {
      console.log("✅ No consent violations found in coach-context code!\n");
    } else {
      console.log("❌ CONSENT VIOLATIONS DETECTED\n");
      console.log("These files access protected tables directly in coach context.");
      console.log("Refactor to use consent views or ConsentDataReader.\n");
      console.log("See: docs/SAFETY_ACCESS_LAYER.md\n");
    }

    if (this.ciMode) {
      console.log("\n--- CI OUTPUT (JSON) ---");
      console.log(
        JSON.stringify(
          {
            success: this.violations.length === 0,
            scannedFiles: this.scannedFiles,
            violations: this.violations,
            warnings: this.warnings.length,
            summary: {
              totalViolations: this.violations.length,
              byTable: this.groupByTable(this.violations),
              byFile: this.groupByFile(this.violations),
            },
          },
          null,
          2,
        ),
      );
    }
  }

  groupByTable(violations) {
    const grouped = {};
    for (const v of violations) {
      grouped[v.table] = (grouped[v.table] || 0) + 1;
    }
    return grouped;
  }

  groupByFile(violations) {
    const grouped = {};
    for (const v of violations) {
      grouped[v.file] = (grouped[v.file] || 0) + 1;
    }
    return grouped;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checker = new ConsentViolationChecker({
    strict: args.includes("--strict"),
    fix: args.includes("--fix"),
    ci: args.includes("--ci"),
  });
  const exitCode = await checker.run();
  process.exit(exitCode);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
