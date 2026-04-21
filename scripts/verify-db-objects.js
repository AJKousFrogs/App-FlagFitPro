#!/usr/bin/env node
/**
 * CI Verification Script: Required DB Objects Must Exist and Be Reachable
 *
 * Usage:
 *   node scripts/verify-db-objects.js
 *   node scripts/verify-db-objects.js --strict
 *   node scripts/verify-db-objects.js --ci
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const REQUIRED_VIEWS = ["v_load_monitoring_consent", "v_workout_logs_consent"];

const REQUIRED_FUNCTIONS = [
  "calculate_daily_load",
  "calculate_acute_load",
  "calculate_chronic_load",
  "calculate_acwr_safe",
  "get_injury_risk_level",
  "check_performance_sharing",
  "check_health_sharing",
  "check_ai_processing_enabled",
  "require_ai_consent",
  "get_ai_consent_status",
  "check_metric_category_allowed",
  "get_coached_teams",
  "initiate_account_deletion",
  "cancel_account_deletion",
  "process_hard_deletion",
  "get_deletions_ready_for_processing",
  "cleanup_expired_emergency_records",
  "get_deletion_status",
  "create_emergency_medical_record",
];

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const SAFE_RPC_PROBES = {
  calculate_daily_load: {
    player_uuid: ZERO_UUID,
    log_date: "2026-01-01",
  },
  calculate_acute_load: {
    player_uuid: ZERO_UUID,
    reference_date: "2026-01-01",
  },
  calculate_chronic_load: {
    player_uuid: ZERO_UUID,
    reference_date: "2026-01-01",
  },
  calculate_acwr_safe: {
    player_uuid: ZERO_UUID,
    reference_date: "2026-01-01",
  },
  get_injury_risk_level: {
    acwr_value: 1,
  },
  check_performance_sharing: {
    p_player_id: ZERO_UUID,
    p_team_id: ZERO_UUID,
  },
  check_health_sharing: {
    p_player_id: ZERO_UUID,
    p_team_id: ZERO_UUID,
  },
  check_ai_processing_enabled: {
    p_user_id: ZERO_UUID,
  },
  require_ai_consent: {
    p_user_id: ZERO_UUID,
  },
  get_ai_consent_status: {
    p_user_id: ZERO_UUID,
  },
  check_metric_category_allowed: {
    p_player_id: ZERO_UUID,
    p_team_id: ZERO_UUID,
    p_category: "performance",
  },
  get_coached_teams: {},
  initiate_account_deletion: {
    p_user_id: null,
    p_reason: "__verify_signature_only__",
  },
  cancel_account_deletion: {
    p_request_id: ZERO_UUID,
    p_user_id: ZERO_UUID,
  },
  process_hard_deletion: {
    p_request_id: ZERO_UUID,
  },
  get_deletions_ready_for_processing: {},
  get_deletion_status: {
    p_user_id: ZERO_UUID,
  },
  create_emergency_medical_record: {
    p_user_id: null,
    p_event_type: "__verify_signature_only__",
    p_medical_data: {},
    p_location_data: null,
  },
};

const REQUIRED_TABLES = [
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

const isCI = process.argv.includes("--ci");
const isStrict = process.argv.includes("--strict") || isCI;

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

async function main() {
  console.log("🔍 Database Objects Verification\n");
  console.log(`${"=".repeat(60)}\n`);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY must be set",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const connectivityOk = await checkConnectivity(supabase);
  if (!connectivityOk) {
    printSummary();
    process.exit(1);
  }

  await checkViews(supabase);
  await checkFunctions(supabase);
  await checkTables(supabase);

  printSummary();

  const shouldFail =
    results.failed.length > 0 || (isStrict && results.warnings.length > 0);
  process.exit(shouldFail ? 1 : 0);
}

async function checkViews(supabase) {
  console.log("📋 Checking Required Views...\n");

  for (const view of REQUIRED_VIEWS) {
    const { error } = await supabase.from(view).select("*").limit(0);

    if (!error) {
      logPass(`View: ${view}`);
    } else if (
      error.code === "42P01" ||
      error.message?.toLowerCase?.().includes("does not exist")
    ) {
      logFail(`View: ${view}`, `View '${view}' does not exist in public schema`);
    } else {
      logFail(`View: ${view}`, `View '${view}' not reachable: ${error.message}`);
    }
  }

  console.log();
}

async function checkFunctions(supabase) {
  console.log("⚙️  Checking Required Functions...\n");
  console.log("   (Using direct RPC probes)\n");

  const missingPatterns = [
    "does not exist",
    "could not find the function",
    "not found in the schema cache",
    "function not found",
  ];

  for (const fn of REQUIRED_FUNCTIONS) {
    try {
      const args = SAFE_RPC_PROBES[fn] ?? {};
      const { error } = await supabase.rpc(fn, args);

      if (!error) {
        logPass(`Function: ${fn}`);
        continue;
      }

      const message = String(error?.message || "");
      if (message.toLowerCase().includes("fetch failed")) {
        logFail(`Function: ${fn}`, "RPC transport failed (fetch failed)");
        continue;
      }

      const missing = missingPatterns.some((p) =>
        message.toLowerCase().includes(p),
      );

      if (missing) {
        logFail(
          `Function: ${fn}`,
          `Function '${fn}()' does not exist or signature drifted: ${message}`,
        );
      } else {
        // Exists but may need runtime preconditions, permissions, or real records.
        logPass(`Function: ${fn}`);
      }
    } catch (e) {
      const message = String(e?.message || "");
      if (message.toLowerCase().includes("fetch failed")) {
        logFail(`Function: ${fn}`, "RPC transport failed (fetch failed)");
        continue;
      }

      const missing = missingPatterns.some((p) =>
        message.toLowerCase().includes(p),
      );

      if (missing) {
        logFail(
          `Function: ${fn}`,
          `Function '${fn}()' does not exist or signature drifted: ${message}`,
        );
      } else {
        // Exists but may need runtime preconditions, permissions, or real records.
        logPass(`Function: ${fn}`);
      }
    }
  }

  console.log();
}

async function checkConnectivity(supabase) {
  console.log("🌐 Checking Supabase Connectivity...\n");
  const { error } = await supabase
    .from("team_members")
    .select("user_id")
    .limit(1);

  if (error && String(error.message || "").toLowerCase().includes("fetch failed")) {
    logFail(
      "Connectivity",
      "Supabase REST transport failed (fetch failed). Check network/project URL/keys.",
    );
    console.log();
    return false;
  }

  if (error) {
    logWarn("Connectivity", `Partial connectivity: ${error.message}`);
  } else {
    logPass("Connectivity", "Supabase REST reachable");
  }
  console.log();
  return true;
}

async function checkTables(supabase) {
  console.log("🔒 Checking Required Privacy/Safety Tables...\n");

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("*").limit(0);

    if (!error) {
      logPass(`Table: ${table}`, "reachable");
    } else if (
      error.code === "42P01" ||
      error.message?.toLowerCase?.().includes("does not exist")
    ) {
      logFail(`Table: ${table}`, `Table '${table}' does not exist`);
    } else {
      logFail(`Table: ${table}`, `Table '${table}' not reachable: ${error.message}`);
    }
  }

  console.log();
}

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

  const strictFailure = isStrict && results.warnings.length > 0;

  if (results.failed.length > 0 || strictFailure) {
    console.log("❌ VERIFICATION FAILED\n");

    if (results.failed.length > 0) {
      console.log("The following checks must pass before deployment:\n");
      for (const fail of results.failed) {
        console.log(`   • ${fail.name}`);
        if (fail.details) {
          console.log(`     ${fail.details}`);
        }
      }
      console.log();
    }

    if (strictFailure) {
      console.log("Strict mode: warnings are treated as failures.\n");
      for (const warning of results.warnings) {
        console.log(`   • ${warning.name}`);
        if (warning.details) {
          console.log(`     ${warning.details}`);
        }
      }
      console.log();
    }
  } else {
    console.log("✅ ALL CHECKS PASSED\n");
  }

  if (isCI) {
    console.log("\n--- CI OUTPUT (JSON) ---");
    console.log(
      JSON.stringify(
        {
          success:
            results.failed.length === 0 &&
            (!isStrict || results.warnings.length === 0),
          strict: isStrict,
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

main().catch((err) => {
  logWarn("fatal", String(err?.message || err));
  printSummary();
  process.exit(1);
});
