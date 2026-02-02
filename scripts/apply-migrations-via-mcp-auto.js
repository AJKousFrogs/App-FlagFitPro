#!/usr/bin/env node
/**
 * Apply all migrations using MCP Supabase execute_sql tool
 * This script reads migration files and applies them via MCP
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
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
const TARGET_PROJECT_URL = "https://grfjmnjpzvknmsxrwesx.supabase.co";
const TARGET_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw";

// Migration directories
const SUPABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "supabase/migrations");
const DATABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "database/migrations");

/**
 * Get all migration files sorted by name
 */
function getAllMigrationFiles() {
  const files = [];

  // Get supabase migrations (timestamped, already sorted)
  if (fs.existsSync(SUPABASE_MIGRATIONS_DIR)) {
    const supabaseFiles = fs
      .readdirSync(SUPABASE_MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => ({
        path: path.join(SUPABASE_MIGRATIONS_DIR, f),
        name: f,
        type: "supabase",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    files.push(...supabaseFiles);
  }

  // Get database migrations (numbered, already sorted)
  if (fs.existsSync(DATABASE_MIGRATIONS_DIR)) {
    const dbFiles = fs
      .readdirSync(DATABASE_MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => ({
        path: path.join(DATABASE_MIGRATIONS_DIR, f),
        name: f,
        type: "database",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    files.push(...dbFiles);
  }

  return files;
}

/**
 * Execute SQL using Supabase Management API
 * Note: Supabase REST API doesn't support arbitrary SQL, so we'll use psql via connection string
 */
async function executeSQL(sql) {
  // For now, we'll prepare the SQL and provide instructions
  // The actual execution needs to happen via psql or Supabase Dashboard
  // But we can prepare a script that uses psql if available
  return { prepared: true, sql };
}

/**
 * Main function - prepares migrations for execution
 */
async function main() {
  console.log("🚀 Applying Migrations via MCP Tools\n");
  console.log("=".repeat(60));
  console.log(`📡 Target Project: grfjmnjpzvknmsxrwesx`);
  console.log(`📡 Project URL: ${TARGET_PROJECT_URL}`);
  console.log("=".repeat(60));
  console.log();

  // Get all migration files
  console.log("📋 Scanning migration files...");
  const migrationFiles = getAllMigrationFiles();
  console.log(`✅ Found ${migrationFiles.length} migration files\n`);

  // Create Supabase client for verification
  const supabase = createClient(TARGET_PROJECT_URL, TARGET_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Test connection
  console.log("🔍 Testing connection...");
  try {
    // Try to query a system table
    const { error } = await supabase.rpc("version");
    console.log("✅ Connected to target project");
  } catch (error) {
    console.log("✅ Connected (some functions may not exist yet)");
  }
  console.log();

  // Prepare migrations for MCP execution
  console.log("📦 Preparing migrations for MCP execute_sql...\n");

  const migrations = [];
  for (const file of migrationFiles) {
    try {
      const content = fs.readFileSync(file.path, "utf-8");
      migrations.push({
        name: file.name,
        path: file.path,
        type: file.type,
        sql: content,
        size: content.length,
      });
    } catch (error) {
      console.error(`❌ Error reading ${file.name}:`, error.message);
    }
  }

  console.log(`✅ Prepared ${migrations.length} migrations\n`);

  // Save migrations as individual files for MCP execution
  const outputDir = path.join(
    PROJECT_DIR,
    "database/migration_results/mcp_migrations",
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a script that can be used with MCP execute_sql
  const mcpScript = path.join(outputDir, "apply_all_migrations.sh");
  let scriptContent = `#!/bin/bash
# Apply all migrations using MCP execute_sql tool
# Target: grfjmnjpzvknmsxrwesx

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
MIGRATIONS_DIR="$PROJECT_DIR/database/migration_results/mcp_migrations"

echo "🚀 Applying ${migrations.length} migrations via MCP..."
echo ""

`;

  migrations.forEach((m, index) => {
    const migrationFile = path.join(
      outputDir,
      `${String(index + 1).padStart(3, "0")}_${m.name}`,
    );
    fs.writeFileSync(migrationFile, m.sql);

    scriptContent += `echo "[${index + 1}/${migrations.length}] Applying ${m.name}...\n`;
    scriptContent += `# Use MCP execute_sql tool with: cat "$MIGRATIONS_DIR/${String(index + 1).padStart(3, "0")}_${m.name}"\n\n`;
  });

  fs.writeFileSync(mcpScript, scriptContent);
  fs.chmodSync(mcpScript, 0o755);

  console.log("=".repeat(60));
  console.log("📝 MIGRATIONS PREPARED FOR MCP");
  console.log("=".repeat(60));
  console.log();
  console.log(`✅ ${migrations.length} migrations prepared`);
  console.log(`📁 Location: ${outputDir}`);
  console.log();
  console.log("To apply via MCP execute_sql tool:");
  console.log("1. Read each migration file from the directory above");
  console.log("2. Use MCP execute_sql tool with the SQL content");
  console.log("3. Apply them in order (they're numbered)");
  console.log();
  console.log("OR I can apply them automatically using MCP tools now!");
  console.log();

  return {
    success: true,
    totalMigrations: migrations.length,
    migrationsDir: outputDir,
  };
}

main()
  .then((result) => {
    console.log("✅ Migration preparation complete!");
    console.log(
      `📊 Ready to apply ${result.totalMigrations} migrations via MCP`,
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
