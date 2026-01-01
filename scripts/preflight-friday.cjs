#!/usr/bin/env node
/**
 * Pre-Flight Script for Friday Test Sessions
 * 
 * Runs all critical validation checks before a test session.
 * Stops on first failure and provides exact remediation steps.
 * 
 * Checks (in order):
 * 1. verify:db - Database objects and RLS verification
 * 2. check:consent:ci - Consent violation detection
 * 3. test:privacy:ci - Privacy safety tests
 * 4. perf:validate:ci - Performance validation
 * 
 * Usage:
 *   npm run preflight:friday
 *   node scripts/preflight-friday.cjs
 *   node scripts/preflight-friday.cjs --skip-perf  # Skip performance tests
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - One or more checks failed
 * 
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

const { spawn } = require('child_process');
const _path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CHECKS = [
  {
    name: 'Database Objects & RLS',
    command: 'npm',
    args: ['run', 'verify:db'],
    description: 'Verifies consent views, ACWR functions, triggers, and RLS policies exist',
    remediation: `
REMEDIATION:
1. Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env
2. Run missing migrations:
   cd database/migrations
   # Apply any unapplied .sql files via Supabase dashboard or CLI
3. If views are missing, run:
   npm run db:audit
4. If RLS is disabled, apply RLS policies:
   psql < database/supabase-rls-policies.sql
`,
  },
  {
    name: 'Consent Violation Check',
    command: 'npm',
    args: ['run', 'check:consent', '--', '--ci', '--strict'],
    description: 'Detects direct table access in coach-context code that bypasses consent views',
    remediation: `
REMEDIATION:
1. Review the violation list above
2. For each violation, refactor to use consent views:
   - workout_logs → v_workout_logs_consent
   - load_monitoring → v_load_monitoring_consent
3. Or use ConsentDataReader utility:
   const { ConsentDataReader } = require('./utils/consent-data-reader.cjs');
4. See: docs/SAFETY_ACCESS_LAYER.md for patterns
`,
  },
  {
    name: 'Privacy Safety Tests',
    command: 'npx',
    args: ['vitest', 'run', 'tests/privacy-safety/', '--reporter=verbose'],
    description: 'Runs privacy and consent test suite',
    remediation: `
REMEDIATION:
1. Review failing test output above
2. Common fixes:
   - consent-gating.test.js: Ensure AI features check consent before processing
   - coach-consent.test.js: Ensure coach queries use consent views
   - deletion-lifecycle.test.js: Ensure 30-day grace period is enforced
   - age-gating.test.js: Ensure 16+ age verification on registration
3. Run individual test for debugging:
   npx vitest run tests/privacy-safety/<failing-test>.js --reporter=verbose
`,
  },
  {
    name: 'Performance Validation',
    command: 'npm',
    args: ['run', 'perf:validate', '--', '--ci'],
    description: 'Validates consent view performance and index coverage',
    skipFlag: '--skip-perf',
    remediation: `
REMEDIATION:
1. If consent views are slow:
   - Check for missing indexes (see recommendations above)
   - Run suggested CREATE INDEX statements
2. If load tests fail:
   - Review query plans with EXPLAIN ANALYZE
   - Consider adding composite indexes for consent join patterns
3. See: docs/PERFORMANCE_VALIDATION.md for optimization guide
`,
  },
];

// ============================================================================
// EXECUTION
// ============================================================================

class PreflightRunner {
  constructor() {
    this.startTime = new Date();
    this.results = [];
    this.skipPerf = process.argv.includes('--skip-perf');
  }

  async run() {
    this.printHeader();

    for (const check of CHECKS) {
      // Skip performance tests if flag is set
      if (check.skipFlag && this.skipPerf) {
        this.printSkipped(check);
        continue;
      }

      const passed = await this.runCheck(check);
      
      if (!passed) {
        this.printFailure(check);
        this.printSummary(false);
        process.exit(1);
      }
    }

    this.printSummary(true);
    process.exit(0);
  }

  printHeader() {
    console.log();
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                    🚀 FRIDAY PRE-FLIGHT CHECK                         ║');
    console.log('╠══════════════════════════════════════════════════════════════════════╣');
    console.log('║  Running all critical validation checks before test session           ║');
    console.log('║  Will stop on first failure with remediation steps                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`Started: ${this.startTime.toISOString()}`);
    console.log();
  }

  async runCheck(check) {
    const checkStart = Date.now();
    
    console.log('─'.repeat(72));
    console.log(`\n📋 CHECK ${this.results.length + 1}/${CHECKS.length}: ${check.name}\n`);
    console.log(`   ${check.description}`);
    console.log(`   Command: ${check.command} ${check.args.join(' ')}`);
    console.log();

    return new Promise((resolve) => {
      const proc = spawn(check.command, check.args, {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true,
        env: { ...process.env },
      });

      proc.on('close', (code) => {
        const duration = Date.now() - checkStart;
        const passed = code === 0;

        this.results.push({
          name: check.name,
          passed,
          duration,
          exitCode: code,
        });

        if (passed) {
          console.log();
          console.log(`   ✅ PASSED (${this.formatDuration(duration)})`);
          console.log();
        }

        resolve(passed);
      });

      proc.on('error', (err) => {
        console.error(`   ❌ Failed to execute: ${err.message}`);
        this.results.push({
          name: check.name,
          passed: false,
          duration: Date.now() - checkStart,
          error: err.message,
        });
        resolve(false);
      });
    });
  }

  printSkipped(check) {
    console.log('─'.repeat(72));
    console.log(`\n⏭️  SKIPPED: ${check.name}\n`);
    console.log(`   Reason: ${check.skipFlag} flag provided`);
    console.log();

    this.results.push({
      name: check.name,
      passed: true,
      skipped: true,
      duration: 0,
    });
  }

  printFailure(check) {
    console.log();
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                         ❌ CHECK FAILED                               ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`Failed Check: ${check.name}`);
    console.log();
    console.log(check.remediation);
  }

  printSummary(allPassed) {
    const endTime = new Date();
    const totalDuration = endTime - this.startTime;

    console.log();
    console.log('═'.repeat(72));
    console.log();
    console.log('📊 PRE-FLIGHT SUMMARY');
    console.log();

    // Results table
    console.log('┌────────────────────────────────────┬──────────┬────────────┐');
    console.log('│ Check                              │ Status   │ Duration   │');
    console.log('├────────────────────────────────────┼──────────┼────────────┤');

    for (const result of this.results) {
      const name = result.name.padEnd(34);
      const status = result.skipped 
        ? '⏭️  SKIP  ' 
        : result.passed 
          ? '✅ PASS  ' 
          : '❌ FAIL  ';
      const duration = result.skipped 
        ? '—'.padStart(10) 
        : this.formatDuration(result.duration).padStart(10);
      
      console.log(`│ ${name} │ ${status} │ ${duration} │`);
    }

    console.log('└────────────────────────────────────┴──────────┴────────────┘');
    console.log();

    // Timestamps
    console.log(`Started:  ${this.startTime.toISOString()}`);
    console.log(`Finished: ${endTime.toISOString()}`);
    console.log(`Duration: ${this.formatDuration(totalDuration)}`);
    console.log();

    // Final verdict
    if (allPassed) {
      console.log('╔══════════════════════════════════════════════════════════════════════╗');
      console.log('║                     ✅ ALL CHECKS PASSED                              ║');
      console.log('║                                                                        ║');
      console.log('║  Ready for Friday test session!                                        ║');
      console.log('║                                                                        ║');
      console.log('║  Next steps:                                                           ║');
      console.log('║  1. Create test accounts (see TEST_PLAN_FRIDAY.md)                     ║');
      console.log('║  2. Seed database with test data                                       ║');
      console.log('║  3. Start the app: npm run dev                                         ║');
      console.log('║  4. Begin 90-minute test session                                       ║');
      console.log('╚══════════════════════════════════════════════════════════════════════╝');
    } else {
      console.log('╔══════════════════════════════════════════════════════════════════════╗');
      console.log('║                     ❌ PRE-FLIGHT FAILED                              ║');
      console.log('║                                                                        ║');
      console.log('║  Fix the issues above before starting test session.                    ║');
      console.log('║                                                                        ║');
      console.log('║  Re-run after fixes:                                                   ║');
      console.log('║    npm run preflight:friday                                            ║');
      console.log('╚══════════════════════════════════════════════════════════════════════╝');
    }

    console.log();
  }

  formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      return `${mins}m ${secs}s`;
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

const runner = new PreflightRunner();
runner.run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

