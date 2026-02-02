#!/usr/bin/env node
/**
 * Apply migrations using Supabase Management API
 * This uses the Management API endpoint to execute SQL directly
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.join(__dirname, "..");

// Load environment variables
const envPath = path.join(PROJECT_DIR, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Target project configuration
const TARGET_PROJECT_REF = "grfjmnjpzvknmsxrwesx";
const TARGET_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw";

const CONSOLIDATED_SQL_FILE = path.join(
  PROJECT_DIR,
  "database/migration_results/all_migrations_consolidated.sql",
);

/**
 * Execute SQL via Supabase Management API
 */
async function executeSQLViaManagementAPI(sql) {
  const url = `https://api.supabase.com/v1/projects/${TARGET_PROJECT_REF}/database/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TARGET_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: sql,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log("🚀 Applying Migrations via Management API\n");
  console.log("=".repeat(60));
  console.log(`📡 Target: ${TARGET_PROJECT_REF}`);
  console.log("=".repeat(60));
  console.log();

  // Read consolidated SQL file
  console.log("📖 Reading consolidated migrations file...");
  if (!fs.existsSync(CONSOLIDATED_SQL_FILE)) {
    console.error(`❌ File not found: ${CONSOLIDATED_SQL_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(CONSOLIDATED_SQL_FILE, "utf-8");
  console.log(`✅ Read ${(sql.length / 1024 / 1024).toFixed(2)} MB of SQL\n`);

  // Try to execute via Management API
  console.log("🔍 Attempting to execute via Management API...");
  try {
    const result = await executeSQLViaManagementAPI(sql);
    console.log("✅ Migrations applied successfully!");
    console.log("Result:", result);
    return { success: true };
  } catch (error) {
    console.log("⚠️  Management API not available or failed");
    console.log(`   Error: ${error.message}\n`);

    console.log("=".repeat(60));
    console.log("📝 Alternative: Use Supabase Dashboard");
    console.log("=".repeat(60));
    console.log();
    console.log("Since Management API isn't available, use the Dashboard:");
    console.log();
    console.log(
      `1. Go to: https://supabase.com/dashboard/project/${TARGET_PROJECT_REF}/sql`,
    );
    console.log("2. Click 'New query'");
    console.log(`3. Copy/paste content from: ${CONSOLIDATED_SQL_FILE}`);
    console.log("4. Click 'Run'");
    console.log();
    console.log("OR use psql:");
    console.log(
      `   psql "postgresql://postgres.${TARGET_PROJECT_REF}:${TARGET_SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres" -f ${CONSOLIDATED_SQL_FILE}`,
    );
    console.log();

    return { success: false, error: error.message };
  }
}

main()
  .then((result) => {
    if (result.success) {
      console.log("\n✅ Migration complete!");
    } else {
      console.log(
        "\n⚠️  Please apply migrations manually using the instructions above.",
      );
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
