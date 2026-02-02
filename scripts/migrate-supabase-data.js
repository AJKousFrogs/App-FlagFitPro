#!/usr/bin/env node
/**
 * Migrate data from old Supabase project to new Supabase project
 *
 * This script:
 * 1. Connects to both old and new Supabase projects
 * 2. Exports all data from the old project
 * 3. Imports data to the new project
 * 4. Handles foreign key relationships
 *
 * Usage:
 *   OLD_SUPABASE_URL=https://pvzicicwxgftcielnm.supabase.co \
 *   OLD_SUPABASE_SERVICE_KEY=old_service_key \
 *   NEW_SUPABASE_URL=https://grfjmnjpzvknmsxrwesx.supabase.co \
 *   NEW_SUPABASE_SERVICE_KEY=new_service_key \
 *   node scripts/migrate-supabase-data.js
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Get environment variables
const OLD_SUPABASE_URL =
  process.env.OLD_SUPABASE_URL || "https://pvzicicwxgftcielnm.supabase.co";
const { OLD_SUPABASE_SERVICE_KEY } = process.env;
const NEW_SUPABASE_URL =
  process.env.NEW_SUPABASE_URL || "https://grfjmnjpzvknmsxrwesx.supabase.co";
const NEW_SUPABASE_SERVICE_KEY =
  process.env.NEW_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!OLD_SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: OLD_SUPABASE_SERVICE_KEY is required");
  console.error("Set it as an environment variable or in your .env file");
  process.exit(1);
}

if (!NEW_SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: NEW_SUPABASE_SERVICE_KEY is required");
  console.error("Set it as an environment variable or in your .env file");
  process.exit(1);
}

// Create Supabase clients
const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Tables to migrate in order (respecting foreign key dependencies)
// Core tables first, then dependent tables
const MIGRATION_ORDER = [
  // Core reference data (no dependencies)
  "positions",
  "exercise_categories",
  "equipment_types",
  "injury_types",
  "notification_types",

  // User and authentication
  "users",
  "user_preferences",
  "user_achievements",
  "user_notification_preferences",
  "gdpr_consent",
  "gdpr_data_processing_log",
  "user_age_groups",
  "youth_athlete_settings",
  "parent_guardian_links",

  // Teams and rosters
  "teams",
  "team_members",
  "team_coaches",
  "team_settings",

  // Training system
  "training_programs",
  "training_phases",
  "training_weeks",
  "training_session_templates",
  "exercises",
  "session_exercises",
  "workout_logs",
  "exercise_logs",
  "session_summaries",

  // Load monitoring
  "load_monitoring",
  "load_daily",
  "training_load_metrics",
  "daily_wellness_checkin",
  "wellness_entries",
  "readiness_scores",
  "acwr_history",

  // Wellness and health
  "wellness_measurements",
  "hydration_logs",
  "injury_tracking",
  "injury_details",
  "athlete_injuries",

  // Nutrition
  "nutrition_logs",
  "nutrition_goals",
  "supplement_logs",
  "usda_foods",
  "athlete_nutrition_profiles",
  "nutrition_plans",
  "meal_templates",

  // Games and tournaments
  "tournaments",
  "tournament_participation",
  "tournament_budgets",
  "games",
  "game_events",
  "game_plays",
  "officials",
  "official_availability",
  "game_official_assignments",

  // Analytics
  "analytics_events",
  "user_analytics",

  // Notifications
  "notifications",
  "push_notification_tokens",
  "parent_notifications",
  "coach_alert_acknowledgments",

  // Community
  "posts",
  "comments",
  "chat_messages",
  "chatbot_user_context",

  // Knowledge base
  "knowledge_base",
  "knowledge_base_categories",

  // Training analytics
  "digest_history",
  "micro_sessions",
  "micro_session_analytics",
];

/**
 * Get all tables from a Supabase project
 */
async function getAllTables(supabase) {
  try {
    const { data, error } = await supabase.rpc("get_all_tables");
    if (error) {
      // Fallback: query information_schema
      const { data: tables, error: schemaError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public");

      if (schemaError) {
        console.warn("⚠️  Could not query tables:", schemaError.message);
        return MIGRATION_ORDER; // Use predefined order
      }

      return tables.map((t) => t.table_name);
    }
    return data || MIGRATION_ORDER;
  } catch (err) {
    console.warn(
      "⚠️  Error getting tables, using predefined order:",
      err.message,
    );
    return MIGRATION_ORDER;
  }
}

/**
 * Export data from a table
 */
async function exportTable(supabase, tableName) {
  try {
    console.log(`  📤 Exporting ${tableName}...`);

    // Get all rows (with pagination for large tables)
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        // Table might not exist or might have RLS blocking
        if (error.code === "PGRST116" || error.message.includes("permission")) {
          console.log(
            `    ⚠️  Skipping ${tableName} (permission denied or doesn't exist)`,
          );
          return null;
        }
        throw error;
      }

      if (data && data.length > 0) {
        allData = allData.concat(data);
        page++;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`    ✅ Exported ${allData.length} rows`);
    return allData;
  } catch (error) {
    console.error(`    ❌ Error exporting ${tableName}:`, error.message);
    return null;
  }
}

/**
 * Import data to a table
 */
async function importTable(supabase, tableName, data) {
  if (!data || data.length === 0) {
    console.log(`  ⏭️  Skipping ${tableName} (no data)`);
    return { success: true, imported: 0 };
  }

  try {
    console.log(`  📥 Importing ${tableName}...`);

    // Insert in batches to avoid timeouts
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const { error } = await supabase.from(tableName).insert(batch);

      if (error) {
        // Check if it's a duplicate key error (data might already exist)
        if (error.code === "23505") {
          console.log(`    ⚠️  Some rows already exist (skipping duplicates)`);
          // Try inserting one by one to skip duplicates
          for (const row of batch) {
            const { error: singleError } = await supabase
              .from(tableName)
              .upsert(row, { onConflict: "id" });
            if (!singleError) {
              imported++;
            } else {
              errors++;
            }
          }
        } else {
          console.error(`    ❌ Error importing batch:`, error.message);
          errors++;
        }
      } else {
        imported += batch.length;
      }
    }

    console.log(
      `    ✅ Imported ${imported} rows${errors > 0 ? ` (${errors} errors)` : ""}`,
    );
    return { success: errors === 0, imported, errors };
  } catch (error) {
    console.error(`    ❌ Error importing ${tableName}:`, error.message);
    return { success: false, imported: 0, errors: 1 };
  }
}

/**
 * Main migration function
 */
async function migrateData() {
  console.log("🚀 Starting Supabase Data Migration\n");
  console.log(`📡 Old Project: ${OLD_SUPABASE_URL}`);
  console.log(`📡 New Project: ${NEW_SUPABASE_URL}\n`);

  // Test connections
  console.log("🔍 Testing connections...");
  try {
    const { data: oldUsers } = await oldSupabase
      .from("users")
      .select("id")
      .limit(1);
    console.log("✅ Connected to old project");
  } catch (error) {
    console.error("❌ Failed to connect to old project:", error.message);
    process.exit(1);
  }

  try {
    const { data: newUsers } = await newSupabase
      .from("users")
      .select("id")
      .limit(1);
    console.log("✅ Connected to new project");
  } catch (error) {
    console.error("❌ Failed to connect to new project:", error.message);
    process.exit(1);
  }

  console.log("\n📋 Getting table list...");
  const tables = await getAllTables(oldSupabase);
  console.log(`✅ Found ${tables.length} tables to migrate\n`);

  // Migration statistics
  const stats = {
    total: tables.length,
    exported: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  // Migrate each table
  for (const tableName of tables) {
    console.log(`\n📦 Processing: ${tableName}`);

    // Export from old
    const data = await exportTable(oldSupabase, tableName);

    if (data === null) {
      stats.skipped++;
      continue;
    }

    stats.exported++;

    // Import to new
    const result = await importTable(newSupabase, tableName, data);

    if (result.success) {
      stats.imported++;
      stats.imported += result.imported;
    } else {
      stats.errors++;
    }
  }

  // Print summary
  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 Migration Summary");
  console.log("=".repeat(50));
  console.log(`Total tables: ${stats.total}`);
  console.log(`Exported: ${stats.exported}`);
  console.log(`Imported: ${stats.imported} rows`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log("=".repeat(50));

  if (stats.errors === 0) {
    console.log("\n✅ Migration completed successfully!");
  } else {
    console.log(`\n⚠️  Migration completed with ${stats.errors} errors`);
    console.log("Please review the errors above and fix any issues.");
  }
}

// Run migration
migrateData().catch((error) => {
  console.error("\n❌ Migration failed:", error);
  process.exit(1);
});
