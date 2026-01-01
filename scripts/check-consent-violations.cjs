#!/usr/bin/env node
/**
 * Consent Violation Checker
 *
 * CI/CD enforcement script that detects forbidden direct table access patterns
 * in coach-facing backend functions.
 *
 * POLICY: "All coach-facing performance access must go through consent views"
 *
 * This script:
 * 1. Scans all Netlify functions and Angular services
 * 2. Detects direct queries to consent-protected tables
 * 3. Identifies coach-context functions that bypass consent views
 * 4. Fails CI if violations are found (--strict mode)
 *
 * Usage:
 *   node scripts/check-consent-violations.cjs           # Report only
 *   node scripts/check-consent-violations.cjs --strict  # Fail on violations
 *   node scripts/check-consent-violations.cjs --fix     # Show fix suggestions
 *   node scripts/check-consent-violations.cjs --ci      # CI mode (JSON output)
 *
 * @see docs/SAFETY_ACCESS_LAYER.md
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Tables that require consent-aware access
  protectedTables: [
    "workout_logs",
    "load_monitoring",
    "training_load_metrics",
    "metric_entries",
    "training_sessions",
    "wellness_entries",
    "wellness_logs",
  ],

  // Consent views that should be used instead
  consentViews: {
    workout_logs: "v_workout_logs_consent",
    load_monitoring: "v_load_monitoring_consent",
  },

  // Files/directories to scan
  // NOTE: Angular frontend is excluded because:
  // 1. It always runs in authenticated user context (can only see own data via RLS)
  // 2. Coach views call backend APIs that enforce consent via ConsentDataReader
  // 3. Supabase RLS prevents direct access to other players' data
  // The consent layer is enforced at the BACKEND, not frontend.
  scanPaths: [
    "netlify/functions/**/*.cjs",
    "netlify/functions/**/*.js",
    "src/**/*.js",
    // 'angular/src/app/**/*.ts', // Excluded - RLS + backend APIs handle consent
  ],

  // Files to exclude from scanning
  excludePatterns: [
    "**/node_modules/**",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.test.js",
    "**/consent-data-reader.cjs", // The helper itself
    "**/check-consent-violations.cjs", // This script
    "**/data-state.cjs", // Data state utilities
    "**/verify-db-objects.cjs", // DB verification script
  ],

  // Coach-context indicators (functions that handle coach data)
  coachContextIndicators: [
    /coach/i,
    /team.*dashboard/i,
    /squad/i,
    /player.*analytics/i,
    /team.*analytics/i,
    /getTeam/i,
    /getCoach/i,
  ],

  // Allowed exceptions (with justification)
  // These are all PLAYER-ONLY endpoints where the authenticated user accesses their OWN data.
  // The userId in queries matches the authenticated user's ID, enforced by baseHandler.
  allowedExceptions: [
    {
      file: "supabase-client.cjs",
      reason: "Database client initialization and helper functions",
    },
    // ========== PLAYER-ONLY ENDPOINTS (user accesses own data) ==========
    {
      file: "training-sessions.cjs",
      reason: "Player-only: user accesses own training sessions",
    },
    {
      file: "training-complete.cjs",
      reason: "Player-only: user completes own training session",
    },
    {
      file: "daily-training.cjs",
      reason: "Player-only: user accesses own daily training",
    },
    {
      file: "user-context.cjs",
      reason: "Player-only: user accesses own context data",
    },
    {
      file: "dashboard.cjs",
      reason: "Player-only: user accesses own dashboard",
    },
    {
      file: "ai-chat.cjs",
      reason: "Player-only: AI uses player own data for coaching",
    },
    {
      file: "training-suggestions.cjs",
      reason: "Player-only: user gets own training suggestions",
    },
    {
      file: "training-stats-enhanced.cjs",
      reason: "Player-only: user accesses own training stats",
    },
    {
      file: "training-plan.cjs",
      reason: "Player-only: user accesses own training plan",
    },
    {
      file: "smart-training-recommendations.cjs",
      reason: "Player-only: user gets own AI recommendations",
    },
    {
      file: "recovery.cjs",
      reason: "Player-only: user accesses own recovery data",
    },
    {
      file: "performance-metrics.cjs",
      reason: "Player-only: user accesses own performance metrics",
    },
    {
      file: "performance-heatmap.cjs",
      reason: "Player-only: user accesses own performance heatmap",
    },
    {
      file: "nutrition.cjs",
      reason: "Player-only: user accesses own nutrition data",
    },
    {
      file: "load-management.cjs",
      reason: "Player-only: user accesses own load management data",
    },
    {
      file: "calc-readiness.cjs",
      reason: "Player-only: user calculates own readiness score",
    },
  ],
};

// ============================================================================
// VIOLATION DETECTION
// ============================================================================

class ConsentViolationChecker {
  constructor(options = {}) {
    this.strict = options.strict || false;
    this.showFix = options.fix || false;
    this.ciMode = options.ci || false;
    this.violations = [];
    this.warnings = [];
    this.scannedFiles = 0;
  }

  /**
   * Main entry point - scan all files
   */
  async run() {
    console.log("🔍 Consent Violation Checker\n");
    console.log(
      'Policy: "All coach-facing performance access must go through consent views"\n',
    );
    console.log(`${"=".repeat(70)}\n`);

    // Get all files to scan
    const files = await this.getFilesToScan();
    console.log(`Scanning ${files.length} files...\n`);

    // Scan each file
    for (const file of files) {
      await this.scanFile(file);
    }

    // Print results
    this.printResults();

    // Return exit code
    if (this.strict && this.violations.length > 0) {
      return 1;
    }
    return 0;
  }

  /**
   * Get list of files to scan
   */
  async getFilesToScan() {
    const allFiles = [];

    for (const pattern of CONFIG.scanPaths) {
      const matches = await glob(pattern, {
        ignore: CONFIG.excludePatterns,
        cwd: process.cwd(),
      });
      allFiles.push(...matches);
    }

    return [...new Set(allFiles)]; // Dedupe
  }

  /**
   * Scan a single file for violations
   */
  async scanFile(filePath) {
    this.scannedFiles++;

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const fileName = path.basename(filePath);

      // Check if file is in allowed exceptions
      const exception = CONFIG.allowedExceptions.find((e) =>
        fileName.includes(e.file),
      );

      // Detect direct table access
      const tableViolations = this.detectDirectTableAccess(content, filePath);

      // Check if this is a coach-context file
      const isCoachContext = this.isCoachContextFile(content, filePath);

      for (const violation of tableViolations) {
        if (exception) {
          // It's an exception, but maybe needs review
          if (exception.requiresReview) {
            this.warnings.push({
              ...violation,
              isException: true,
              exceptionReason: exception.reason,
            });
          }
        } else if (isCoachContext) {
          // Coach context + direct table access = violation
          this.violations.push({
            ...violation,
            isCoachContext: true,
            severity: "error",
          });
        } else {
          // Not coach context, but still worth noting
          this.warnings.push({
            ...violation,
            isCoachContext: false,
            severity: "warning",
          });
        }
      }
    } catch (err) {
      console.warn(`  ⚠️  Could not read ${filePath}: ${err.message}`);
    }
  }

  /**
   * Detect direct access to protected tables
   * Only flags READ operations (.select()), not WRITE operations (.insert(), .update(), .upsert(), .delete())
   */
  detectDirectTableAccess(content, filePath) {
    const violations = [];
    const lines = content.split("\n");

    // Pattern: .from('table_name') or .from("table_name")
    const fromPattern = /\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    // Write operation patterns - these are allowed even on protected tables
    const writeOperationPatterns = [
      /\.insert\s*\(/,
      /\.update\s*\(/,
      /\.upsert\s*\(/,
      /\.delete\s*\(/,
    ];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      let match;

      // Reset regex lastIndex for each line
      fromPattern.lastIndex = 0;

      while ((match = fromPattern.exec(line)) !== null) {
        const tableName = match[1].toLowerCase();

        if (CONFIG.protectedTables.includes(tableName)) {
          // Check if this is a write operation by looking at the rest of the line
          // and the next few lines for chained method calls
          const remainingLine = line.substring(match.index);
          const nextLines = lines.slice(lineNum, lineNum + 5).join("\n");

          const isWriteOperation = writeOperationPatterns.some(
            (pattern) => pattern.test(remainingLine) || pattern.test(nextLines),
          );

          // Skip write operations - consent rules only apply to READ access
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
            suggestion: consentView
              ? `Use '${consentView}' view or ConsentDataReader`
              : "Use ConsentDataReader for consent-aware access",
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check if file handles coach context
   */
  isCoachContextFile(content, filePath) {
    const fileName = path.basename(filePath).toLowerCase();

    // Angular services that access player's own data are NOT coach context
    // These use the authenticated user's ID to query their own data
    const playerOwnDataServices = [
      "wellness.service.ts",
      "acwr.service.ts",
      "training-data.service.ts",
      "recovery.service.ts",
      "performance-data.service.ts",
      "training-safety.service.ts",
      "data-export.service.ts", // User exports their own data
    ];

    if (playerOwnDataServices.some((svc) => fileName.includes(svc))) {
      return false; // Explicitly NOT coach context
    }

    // Angular components that access player's own data are NOT coach context
    const playerOwnDataComponents = [
      "workout.component.ts",
      "training.component.ts",
      "profile.component.ts",
      "training-builder.component.ts",
      "training-schedule.component.ts",
      "training-safety.component.ts",
      "smart-training-form.component.ts",
      "ai-training-scheduler.component.ts",
      "enhanced-analytics.component.ts", // Player's own analytics
    ];

    if (playerOwnDataComponents.some((cmp) => fileName.includes(cmp))) {
      return false; // Explicitly NOT coach context
    }

    // Check filename
    if (fileName.includes("coach")) {
      return true;
    }

    // Check content for coach-context indicators
    for (const pattern of CONFIG.coachContextIndicators) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check for function names that indicate coach context
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

  /**
   * Print results
   */
  printResults() {
    console.log("=".repeat(70));
    console.log("\n📊 RESULTS\n");

    console.log(`   Files scanned:  ${this.scannedFiles}`);
    console.log(`   ❌ Violations:  ${this.violations.length}`);
    console.log(`   ⚠️  Warnings:    ${this.warnings.length}`);
    console.log();

    // Print violations
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

    // Print warnings
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

    // Summary
    if (this.violations.length === 0) {
      console.log("✅ No consent violations found in coach-context code!\n");
    } else {
      console.log("❌ CONSENT VIOLATIONS DETECTED\n");
      console.log(
        "These files access protected tables directly in coach context.",
      );
      console.log("Refactor to use consent views or ConsentDataReader.\n");
      console.log("See: docs/SAFETY_ACCESS_LAYER.md\n");
    }

    // CI mode: JSON output
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

// ============================================================================
// CLI
// ============================================================================

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
