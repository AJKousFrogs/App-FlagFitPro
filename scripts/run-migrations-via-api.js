/**
 * Run Migrations via Supabase API
 * Uses the Supabase client utilities created today to run migrations
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_DIR = join(__dirname, "..");

const supabaseUrl =
  process.env.SUPABASE_URL || "https://grfjmnjpzvknmsxrwesx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error("❌ Error: SUPABASE_SERVICE_KEY not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Migration files in order
const MIGRATIONS = [
  "database/migrations/001_base_tables.sql",
  "database/migrations/025_complete_flag_football_player_system.sql",
  "database/migrations/026_enhanced_strength_conditioning_system.sql",
  "database/migrations/027_load_management_system.sql",
  "database/migrations/028_evidence_based_knowledge_base.sql",
  "database/migrations/029_game_events_system.sql",
  "database/migrations/029_sponsors_table.sql",
  "database/migrations/030_advanced_ux_components_support.sql",
  "database/migrations/031_open_data_sessions_system.sql",
  "database/migrations/031_wellness_and_measurements_tables.sql",
  "database/migrations/032_acwr_compute_function.sql",
  "database/migrations/032_fix_analytics_events_rls_performance.sql",
  "database/migrations/033_consolidate_analytics_events_policies.sql",
  "database/migrations/033_readiness_score_system.sql",
  "database/migrations/033_readiness_score_system_create_tables.sql",
  "database/migrations/034_check_acwr_rpe_consistency.sql",
  "database/migrations/034_enable_rls_wearables_data.sql",
  "database/migrations/035_enable_rls_remaining_tables.sql",
  "database/migrations/036_add_rls_policies_users_implementation_steps.sql",
  "database/migrations/037_fix_users_insert_policy_registration.sql",
  "database/migrations/037_notifications_unification.sql",
  "database/migrations/038_add_username_and_verification_fields.sql",
  "database/migrations/039_chatbot_role_aware_system.sql",
  "database/migrations/040_knowledge_base_governance.sql",
  "database/migrations/041_player_stats_aggregation_view.sql",
  "database/migrations/042_training_data_consistency.sql",
  "database/migrations/043_database_upgrade_consistency.sql",
  "database/migrations/044_fix_rls_performance_and_consolidate_policies.sql",
  "database/migrations/045_add_missing_constraints.sql",
  "database/migrations/046_fix_acwr_baseline_checks_supabase.sql",
];

async function runMigration(filePath) {
  const fullPath = join(PROJECT_DIR, filePath);

  try {
    const sql = readFileSync(fullPath, "utf8");

    console.log(`\n📄 Running: ${filePath}`);

    // Use Supabase's RPC to execute SQL
    // Note: This requires a function in Supabase that can execute SQL
    // Alternatively, we can use the REST API's query endpoint
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      // If RPC doesn't exist, try direct query (won't work for DDL)
      console.log(
        `⚠️  RPC method not available. This migration needs to be run via Supabase Dashboard SQL Editor.`,
      );
      console.log(`   File: ${filePath}`);
      return { success: false, error: "RPC not available", needsManual: true };
    }

    console.log(`✅ Success: ${filePath}`);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("🚀 Running Migrations via Supabase API\n");
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log(`📁 Project Directory: ${PROJECT_DIR}\n`);

  console.log(
    "⚠️  Note: Supabase REST API cannot execute DDL statements (CREATE TABLE, etc.)",
  );
  console.log("   Migrations must be run via:");
  console.log("   1. Supabase Dashboard SQL Editor (Recommended)");
  console.log("   2. Direct PostgreSQL connection");
  console.log("   3. Supabase CLI\n");

  console.log("📋 Migration files to run:\n");

  let successCount = 0;
  let needsManualCount = 0;
  let errorCount = 0;

  for (const migration of MIGRATIONS) {
    const result = await runMigration(migration);
    if (result.success) {
      successCount++;
    } else if (result.needsManual) {
      needsManualCount++;
    } else {
      errorCount++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Migration Summary");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Needs Manual: ${needsManualCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(
    `\n💡 All migrations need to be run via Supabase Dashboard SQL Editor`,
  );
  console.log(`   See: database/migration_results/EXECUTION_PLAN.md`);
}

main().catch(console.error);
