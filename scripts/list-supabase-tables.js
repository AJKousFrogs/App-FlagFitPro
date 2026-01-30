/**
 * List all tables in Supabase database
 * Tests known tables and reports which ones exist
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://grfjmnjpzvknmsxrwesx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Use service key if available (for admin operations), otherwise use anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error("❌ Error: Missing Supabase credentials");
  console.error(
    "Please set SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY environment variable",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTableExists(tableName) {
  try {
    // Try to query the table with limit 0 (just check if it exists)
    const { error } = await supabase.from(tableName).select("*").limit(0);

    // PGRST116 = no rows found (table exists but empty)
    // 42P01 = relation does not exist
    // Other errors might indicate RLS issues but table exists
    if (!error || error.code === "PGRST116") {
      return { exists: true, error: null };
    } else if (error.code === "42P01") {
      return { exists: false, error: null };
    } else {
      // Table might exist but have RLS restrictions
      // Try to get count which sometimes works even with RLS
      const { count } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      return { exists: count !== null, error: error.message };
    }
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function listAllTables() {
  console.log("🔍 Querying Supabase database for tables...\n");
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using: ${supabaseServiceKey ? "Service Key" : "Anon Key"}\n`);

  // Comprehensive list of tables from the codebase
  const knownTables = [
    // Core tables
    "users",
    "teams",
    "players",
    "games",

    // Training system
    "training_sessions",
    "training_programs",
    "training_phases",
    "training_weeks",
    "exercises",
    "workouts",
    "exercise_library",

    // Analytics & Events
    "analytics_events",
    "user_analytics",

    // Communication
    "notifications",
    "chat_messages",
    "posts",
    "comments",

    // Tournaments & Competitions
    "tournaments",
    "tournament_teams",
    "tournament_games",

    // Positions & Roles
    "positions",

    // Wellness & Health
    "wellness_measurements",
    "hydration_logs",
    "nutrition_logs",
    "recovery_sessions",
    "injuries",

    // Game Events
    "game_events",
    "player_stats",

    // Knowledge Base
    "knowledge_base",
    "knowledge_base_categories",

    // Supplements & Compliance
    "supplements",
    "wada_prohibited_substances",
    "supplement_wada_compliance",
    "athlete_supplement_monitoring",

    // Research Data
    "hydration_research_studies",
    "hydration_physiology_data",
    "ifaf_hydration_protocols",
    "training_hydration_protocols",
    "user_hydration",
    "hydration_injury_prevention",
    "hydration_performance_optimization",
    "creatine_research",
    "beta_alanine_research",
    "caffeine_research",

    // Nutrition
    "nutrition_plans",
    "nutrition_recommendations",
    "nutrition_performance_correlations",
    "athlete_nutrition_profiles",
    "user_nutrition_targets",

    // Recovery
    "recovery_protocols",
    "recovery_recommendations",
    "recovery_analytics",
    "recovery_equipment",
    "athlete_recovery_profiles",

    // Load Management
    "load_management",
    "acwr_calculations",

    // Other
    "sponsors",
    "open_data_sessions",
    "readiness_scores",
    "wearables_data",
  ];

  console.log(`📋 Checking ${knownTables.length} known tables...\n`);

  const existingTables = [];
  const missingTables = [];
  const errorTables = [];

  for (const tableName of knownTables) {
    const result = await checkTableExists(tableName);
    if (result.exists) {
      existingTables.push({ name: tableName, error: result.error });
    } else if (result.error && !result.error.includes("does not exist")) {
      errorTables.push({ name: tableName, error: result.error });
    } else {
      missingTables.push(tableName);
    }
  }

  // Display results
  console.log("=".repeat(60));
  console.log(`📊 RESULTS\n`);
  console.log(`✅ Found: ${existingTables.length} tables`);
  if (errorTables.length > 0) {
    console.log(
      `⚠️  Errors: ${errorTables.length} tables (may exist but have RLS restrictions)`,
    );
  }
  console.log(`❌ Missing: ${missingTables.length} tables\n`);

  if (existingTables.length > 0) {
    console.log("✅ EXISTING TABLES:");
    console.log("-".repeat(60));
    existingTables.forEach((table, index) => {
      const status = table.error ? "⚠️ " : "✅";
      console.log(
        `${status} ${(index + 1).toString().padStart(3)}. ${table.name}`,
      );
      if (table.error) {
        console.log(`      Note: ${table.error}`);
      }
    });
  }

  if (errorTables.length > 0) {
    console.log("\n⚠️  TABLES WITH ERRORS (may exist but inaccessible):");
    console.log("-".repeat(60));
    errorTables.forEach((table, index) => {
      console.log(`   ${(index + 1).toString().padStart(3)}. ${table.name}`);
      console.log(`      Error: ${table.error}`);
    });
  }

  if (missingTables.length > 0) {
    console.log("\n❌ MISSING TABLES:");
    console.log("-".repeat(60));
    missingTables.forEach((table, index) => {
      console.log(`   ${(index + 1).toString().padStart(3)}. ${table}`);
    });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n📊 TOTAL TABLES FOUND: ${existingTables.length}`);
  console.log(`\n💡 Note: This script checks known tables from the codebase.`);
  console.log(`   To see ALL tables, use the Supabase Dashboard SQL Editor:`);
  console.log(
    `   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`,
  );
}

// Run the script
listAllTables().catch(console.error);
