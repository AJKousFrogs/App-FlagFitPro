#!/usr/bin/env node

/**
 * Direct Migration Runner
 * Legacy helper for applying the username/verification migration.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { createLogger } from "../netlify/functions/utils/structured-logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationCandidates = [
  "../database/migrations/038_add_username_and_verification_fields.sql",
];

function resolveMigrationPath() {
  for (const rel of migrationCandidates) {
    const abs = path.join(__dirname, rel);
    if (fs.existsSync(abs)) {
      return abs;
    }
  }
  return path.join(__dirname, migrationCandidates[0]);
}

const migrationPath = resolveMigrationPath();
const migrationSql = fs.readFileSync(migrationPath, "utf8");
const logger = createLogger({
  service: "migration_tool",
  context: { tool: "run_migration_direct" },
});

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

logger.info("migration_tool_invoked", {
  supabaseUrl: supabaseUrl ?? null,
  serviceKeyPresent: Boolean(supabaseServiceKey),
  migrationPath,
});

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error(
    "migration_tool_missing_env",
    undefined,
    {
      missingSupabaseUrl: !supabaseUrl,
      missingServiceKey: !supabaseServiceKey,
    },
  );

  console.error("❌ Error: Missing Supabase environment variables");
  console.error(
    "Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env file\n",
  );

  console.log("📋 Manual Migration Instructions:");
  console.log("─".repeat(80));
  console.log("1. Go to Supabase Dashboard → SQL Editor");
  console.log(
    "2. Copy the SQL from the migration file path shown below",
  );
  console.log("3. Paste and run the SQL in the editor");
  console.log("─".repeat(80));
  console.log("");
  console.log("SQL Preview:");
  console.log("─".repeat(80));

  console.log(`Selected migration path: ${migrationPath}`);
  console.log(migrationSql);
  console.log("─".repeat(80));

  process.exit(1);
}

// Initialize Supabase client
const _supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkAndApplyMigration() {
  try {
    logger.info("migration_tool_schema_check_start", {
      migrationPath,
    });

    // Check if columns already exist
    const _checks = {
      username: false,
      verification_token: false,
      verification_token_expires_at: false,
      role: false,
    };

    // We can't query information_schema directly with Supabase JS client
    // So we'll attempt to read from users table and catch errors
    logger.warn(
      "migration_tool_schema_check_limitation",
      {
        reason: "Supabase JS client cannot query information_schema",
      },
    );
    console.log(
      "⚠️  Note: Cannot check schema directly with Supabase JS client",
    );
    console.log(
      "📋 Providing SQL for manual execution in Supabase Dashboard:\n",
    );

    console.log("─".repeat(80));
    console.log(`Using migration path: ${migrationPath}`);
    console.log(migrationSql);
    console.log("─".repeat(80));

    console.log("\n📝 Instructions:");
    console.log("1. Copy the SQL above");
    console.log("2. Go to https://supabase.com/dashboard");
    console.log("3. Select your project");
    console.log('4. Click "SQL Editor" in the left sidebar');
    console.log("5. Create a new query and paste the SQL");
    console.log('6. Click "Run" to execute');
    console.log("");
    console.log(
      "✅ This migration is safe to run multiple times (it checks before adding columns)",
    );
  } catch (error) {
    logger.error(
      "migration_tool_schema_check_failed",
      error,
      {
        migrationPath,
      },
    );
  }
}

checkAndApplyMigration();
