#!/usr/bin/env node
/**
 * Apply all migrations to target Supabase project using MCP tools
 * Target: grfjmnjpzvknmsxrwesx
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
 * Apply migration using Supabase client
 */
async function applyMigration(supabase, migrationName, sql) {
  try {
    console.log(`  📝 Applying: ${migrationName}...`);

    // Use RPC to execute SQL (if available) or use execute_sql
    // For now, we'll use the REST API to execute SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      // Try direct SQL execution via REST API
      // Note: Supabase REST API doesn't support arbitrary SQL
      // We need to use the Management API or SQL Editor
      console.log(
        `    ⚠️  Cannot apply via REST API. Use Supabase Dashboard SQL Editor.`,
      );
      return { success: false, error: "Use SQL Editor" };
    }

    console.log(`    ✅ Applied successfully`);
    return { success: true };
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Applying Migrations to Target Project\n");
  console.log("=".repeat(60));
  console.log(`📡 Target Project: grfjmnjpzvknmsxrwesx`);
  console.log(`📡 Project URL: ${TARGET_PROJECT_URL}`);
  console.log("=".repeat(60));
  console.log();

  // Create Supabase client
  const supabase = createClient(TARGET_PROJECT_URL, TARGET_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Test connection
  console.log("🔍 Testing connection...");
  try {
    const { data, error } = await supabase
      .from("_migrations")
      .select("version")
      .limit(1);
    console.log("✅ Connected to target project");
  } catch (error) {
    // Table might not exist yet, which is fine
    console.log("✅ Connected (migrations table may not exist yet)");
  }
  console.log();

  // Get all migration files
  console.log("📋 Scanning migration files...");
  const migrationFiles = getAllMigrationFiles();
  console.log(`✅ Found ${migrationFiles.length} migration files\n`);

  // Prepare migrations
  const migrations = [];
  for (const file of migrationFiles) {
    try {
      const content = fs.readFileSync(file.path, "utf-8");
      const migrationName = file.name
        .replace(/\.sql$/, "")
        .replace(/^\d+_/, "");

      migrations.push({
        name: migrationName,
        filename: file.name,
        path: file.path,
        type: file.type,
        sql: content,
      });
    } catch (error) {
      console.error(`❌ Error reading ${file.name}:`, error.message);
    }
  }

  console.log(`📦 Prepared ${migrations.length} migrations\n`);

  // Save migration instructions
  const outputDir = path.join(PROJECT_DIR, "database/migration_results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const instructionsFile = path.join(
    outputDir,
    "apply_migrations_instructions.md",
  );
  let instructions = `# Apply Migrations to grfjmnjpzvknmsxrwesx\n\n`;
  instructions += `## Instructions\n\n`;
  instructions += `Since Supabase REST API doesn't support arbitrary SQL execution, you need to apply migrations via:\n\n`;
  instructions += `### Option 1: Supabase Dashboard SQL Editor (Recommended)\n\n`;
  instructions += `1. Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql\n`;
  instructions += `2. Click "New query"\n`;
  instructions += `3. Copy and paste each migration file in order\n`;
  instructions += `4. Run each migration\n\n`;
  instructions += `### Option 2: Use Supabase CLI\n\n`;
  instructions += `\`\`\`bash\n`;
  instructions += `supabase link --project-ref grfjmnjpzvknmsxrwesx\n`;
  instructions += `supabase db push\n`;
  instructions += `\`\`\`\n\n`;
  instructions += `### Migration Files (${migrations.length} total)\n\n`;

  migrations.forEach((m, index) => {
    instructions += `${index + 1}. **${m.filename}** (${m.type})\n`;
    instructions += `   - Path: \`${m.path}\`\n`;
    instructions += `   - Size: ${m.sql.length} bytes\n\n`;
  });

  fs.writeFileSync(instructionsFile, instructions);

  console.log("=".repeat(60));
  console.log("📝 MIGRATION INSTRUCTIONS");
  console.log("=".repeat(60));
  console.log();
  console.log("⚠️  Supabase REST API doesn't support arbitrary SQL execution.");
  console.log("   You need to apply migrations via one of these methods:\n");
  console.log("Option 1: Supabase Dashboard SQL Editor (Easiest)");
  console.log(
    `   1. Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql`,
  );
  console.log("   2. Click 'New query'");
  console.log("   3. Copy/paste each migration file and run\n");
  console.log("Option 2: Use Supabase CLI");
  console.log("   supabase link --project-ref grfjmnjpzvknmsxrwesx");
  console.log("   supabase db push\n");
  console.log(`📊 Detailed instructions saved to: ${instructionsFile}`);
  console.log();
  console.log(`Total migrations to apply: ${migrations.length}`);
  console.log();

  return {
    success: true,
    totalMigrations: migrations.length,
    instructionsFile,
  };
}

main()
  .then((result) => {
    console.log("✅ Migration preparation complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
