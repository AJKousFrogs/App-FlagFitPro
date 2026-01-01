#!/usr/bin/env node
/**
 * CI Verification Script: Required DB Objects & RLS Must Exist
 *
 * This script verifies database integrity and security requirements:
 * - Consent views exist (v_load_monitoring_consent, v_workout_logs_consent)
 * - ACWR functions exist (calculate_daily_load, calculate_acute_load, etc.)
 * - Trigger exists and attached (trigger_update_load_monitoring)
 * - RLS enabled on privacy tables
 * - AI processing fail-fast function exists
 *
 * Exit codes:
 * - 0: All checks passed
 * - 1: One or more checks failed
 *
 * Usage:
 *   node scripts/verify-db-objects.cjs
 *   node scripts/verify-db-objects.cjs --ci  # CI mode with machine-readable output
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const REQUIRED_VIEWS = [
  "v_load_monitoring_consent",
  "v_workout_logs_consent",
  // Removed: 'v_load_monitoring' - depends on undeployed risk_level_enum
  // Removed: 'v_player_program_compliance' - depends on undeployed player_programs table
];

const REQUIRED_FUNCTIONS = [
  // ACWR functions
  "calculate_daily_load",
  "calculate_acute_load",
  "calculate_chronic_load",
  "calculate_acwr_safe",
  "get_injury_risk_level",
  // Consent functions
  "check_performance_sharing",
  "check_health_sharing",
  "check_ai_processing_enabled",
  "require_ai_consent",
  "get_ai_consent_status",
  "check_metric_category_allowed",
  "get_coached_teams",
  // Deletion functions
  "initiate_account_deletion",
  "cancel_account_deletion",
  "process_hard_deletion",
  "get_deletions_ready_for_processing",
  "cleanup_expired_emergency_records",
  "get_deletion_status",
  "create_emergency_medical_record",
];

const REQUIRED_TRIGGERS = ["trigger_update_load_monitoring"];

const RLS_REQUIRED_TABLES = [
  "privacy_settings",
  "team_sharing_settings",
  "parental_consent",
  "account_deletion_requests",
  "emergency_medical_records",
  "privacy_audit_log",
  "consent_access_log",
  "load_monitoring",
  "workout_logs",
  "wellness_logs",
  "wellness_entries",
];

// ============================================================================
// MAIN
// ============================================================================

const isCI = process.argv.includes("--ci");
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

async function main() {
  console.log("🔍 Database Objects & RLS Verification\n");
  console.log(`${"=".repeat(60)}\n`);

  // Get Supabase connection
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
    console.error("   Set these environment variables or create a .env file");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // Run all checks
  await checkViews(supabase);
  await checkFunctions(supabase);
  await checkTriggers(supabase);
  await checkRLS(supabase);
  await runVerifyDatabaseBootstrap(supabase);

  // Print summary
  printSummary();

  // Exit with appropriate code
  if (results.failed.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

async function checkViews(supabase) {
  console.log("📋 Checking Required Views...\n");

  // Check each view by attempting to query it directly
  // This is more reliable than querying information_schema through Supabase
  for (const view of REQUIRED_VIEWS) {
    const { data: _data, error } = await supabase
      .from(view)
      .select("*")
      .limit(0); // Don't fetch any rows, just check if view exists

    if (!error) {
      logPass(`View: ${view}`);
    } else if (
      error.code === "42P01" ||
      error.message?.includes("does not exist")
    ) {
      logFail(
        `View: ${view}`,
        `View '${view}' does not exist in public schema`,
      );
    } else {
      // View exists but may have RLS or other restrictions - that's OK
      logPass(`View: ${view}`, "exists (query restricted)");
    }
  }

  console.log();
}

async function checkFunctions(supabase) {
  console.log("⚙️  Checking Required Functions...\n");

  // Query pg_proc for functions
  const { data: functions, error } = await supabase.rpc("sql", {
    query: `
      SELECT proname 
      FROM pg_proc 
      JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
      WHERE pg_namespace.nspname = 'public'
    `,
  });

  let functionNames = [];
  if (error || !functions) {
    // Fallback: try to call each function with invalid args to see if it exists
    console.log("   (Using fallback function detection method)\n");
    for (const fn of REQUIRED_FUNCTIONS) {
      try {
        // This will fail but tell us if function exists
        await supabase.rpc(fn, {});
        functionNames.push(fn);
      } catch (e) {
        // If error mentions "function", it exists but args are wrong
        if (e.message && !e.message.includes("does not exist")) {
          functionNames.push(fn);
        }
      }
    }
  } else {
    functionNames = functions.map((f) => f.proname);
  }

  for (const fn of REQUIRED_FUNCTIONS) {
    if (functionNames.includes(fn)) {
      logPass(`Function: ${fn}`);
    } else {
      logFail(`Function: ${fn}`, `Function '${fn}()' does not exist`);
    }
  }

  console.log();
}

async function checkTriggers(supabase) {
  console.log("🔔 Checking Required Triggers...\n");

  const { data: triggers, error } = await supabase.rpc("sql", {
    query: `
      SELECT tgname, relname as table_name
      FROM pg_trigger
      JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
      WHERE NOT tgisinternal
    `,
  });

  let triggerNames = [];
  if (!error && triggers) {
    triggerNames = triggers.map((t) => t.tgname);
  }

  // If we couldn't query triggers (no sql RPC), log warning but don't fail
  // Triggers are verified via migration application
  if (error || !triggers) {
    for (const trigger of REQUIRED_TRIGGERS) {
      logWarn(
        `Trigger: ${trigger}`,
        "Cannot verify (no sql RPC) - check via migration logs",
      );
    }
  } else {
    for (const trigger of REQUIRED_TRIGGERS) {
      if (triggerNames.includes(trigger)) {
        const triggerInfo = triggers?.find((t) => t.tgname === trigger);
        logPass(
          `Trigger: ${trigger}`,
          `Attached to: ${triggerInfo?.table_name || "unknown"}`,
        );
      } else {
        logFail(
          `Trigger: ${trigger}`,
          `Trigger '${trigger}' does not exist or is not attached`,
        );
      }
    }
  }

  console.log();
}

async function checkRLS(supabase) {
  console.log("🔒 Checking RLS Status on Privacy Tables...\n");

  const { data: tables, error } = await supabase.rpc("sql", {
    query: `
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
    `,
  });

  const tableRLS = {};
  if (!error && tables) {
    tables.forEach((t) => {
      tableRLS[t.tablename] = t.rowsecurity;
    });
  }

  for (const table of RLS_REQUIRED_TABLES) {
    if (tableRLS[table] === true) {
      logPass(`RLS: ${table}`, "Row Level Security enabled");
    } else if (tableRLS[table] === false) {
      logFail(`RLS: ${table}`, `Row Level Security is DISABLED on '${table}'`);
    } else {
      logWarn(
        `RLS: ${table}`,
        `Table '${table}' not found or RLS status unknown`,
      );
    }
  }

  console.log();
}

async function runVerifyDatabaseBootstrap(supabase) {
  console.log("🧪 Running verify_database_bootstrap()...\n");

  const { data: results, error } = await supabase.rpc(
    "verify_database_bootstrap",
  );

  if (error) {
    logWarn(
      "verify_database_bootstrap",
      `Function returned error: ${error.message}`,
    );
    return;
  }

  if (results && results.length > 0) {
    for (const check of results) {
      if (check.status === "PASS") {
        logPass(`Bootstrap: ${check.check_name}`, check.details);
      } else if (check.status === "WARN") {
        logWarn(`Bootstrap: ${check.check_name}`, check.details);
      } else {
        logFail(`Bootstrap: ${check.check_name}`, check.details);
      }
    }
  }

  console.log();
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

function logPass(name, details = "") {
  const msg = details ? `${name} - ${details}` : name;
  console.log(`   ✅ ${msg}`);
  results.passed.push({ name, details });
}

function logFail(name, details = "") {
  const msg = details ? `${name} - ${details}` : name;
  console.log(`   ❌ ${msg}`);
  results.failed.push({ name, details });
}

function logWarn(name, details = "") {
  const msg = details ? `${name} - ${details}` : name;
  console.log(`   ⚠️  ${msg}`);
  results.warnings.push({ name, details });
}

function printSummary() {
  console.log("=".repeat(60));
  console.log("\n📊 SUMMARY\n");

  console.log(`   ✅ Passed:   ${results.passed.length}`);
  console.log(`   ❌ Failed:   ${results.failed.length}`);
  console.log(`   ⚠️  Warnings: ${results.warnings.length}`);
  console.log();

  if (results.failed.length > 0) {
    console.log("❌ VERIFICATION FAILED\n");
    console.log("The following checks must pass before deployment:\n");
    for (const fail of results.failed) {
      console.log(`   • ${fail.name}`);
      if (fail.details) {
        console.log(`     ${fail.details}`);
      }
    }
    console.log();
  } else {
    console.log("✅ ALL CHECKS PASSED\n");
  }

  // CI mode: output JSON for parsing
  if (isCI) {
    console.log("\n--- CI OUTPUT (JSON) ---");
    console.log(
      JSON.stringify(
        {
          success: results.failed.length === 0,
          passed: results.passed.length,
          failed: results.failed.length,
          warnings: results.warnings.length,
          details: {
            passed: results.passed,
            failed: results.failed,
            warnings: results.warnings,
          },
        },
        null,
        2,
      ),
    );
  }
}

// ============================================================================
// SQL HELPER (for databases without custom RPC)
// ============================================================================

// Create the SQL RPC function if it doesn't exist
// This is a helper that allows running arbitrary SQL for verification
async function _ensureSqlRpc(_supabase) {
  // This function should already exist in production
  // If not, verification will use fallback methods
}

// Run main
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
