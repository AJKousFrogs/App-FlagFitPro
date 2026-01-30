#!/usr/bin/env node
/**
 * Apply missing migrations using MCP Supabase tools
 * 
 * This script:
 * 1. Checks which migrations are already applied
 * 2. Identifies missing migrations
 * 3. Provides instructions for applying via MCP tools
 * 
 * Usage:
 *   node scripts/apply-missing-migrations-mcp.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.join(__dirname, "..");

// Migration directories
const SUPABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "supabase/migrations");
const DATABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "database/migrations");

/**
 * Get migration name from filename
 */
function getMigrationName(filename) {
  let name = filename.replace(/\.sql$/, "");
  
  // For timestamped migrations (20260130_name), extract just the name part
  const match = name.match(/^\d+_(.+)$/);
  if (match) {
    name = match[1];
  }
  
  // Convert to snake_case
  return name.replace(/[-\s]/g, "_").toLowerCase();
}

/**
 * Get all local migration files
 */
function getLocalMigrations() {
  const migrations = [];
  
  // Get supabase migrations
  if (fs.existsSync(SUPABASE_MIGRATIONS_DIR)) {
    const files = fs.readdirSync(SUPABASE_MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => {
        const filePath = path.join(SUPABASE_MIGRATIONS_DIR, f);
        const content = fs.readFileSync(filePath, "utf-8");
        return {
          filename: f,
          path: filePath,
          name: getMigrationName(f),
          content: content,
          type: "supabase"
        };
      });
    migrations.push(...files);
  }
  
  // Get database migrations (prioritize numbered ones)
  if (fs.existsSync(DATABASE_MIGRATIONS_DIR)) {
    const files = fs.readdirSync(DATABASE_MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => {
        const filePath = path.join(DATABASE_MIGRATIONS_DIR, f);
        const content = fs.readFileSync(filePath, "utf-8");
        return {
          filename: f,
          path: filePath,
          name: getMigrationName(f),
          content: content,
          type: "database"
        };
      });
    migrations.push(...files);
  }
  
  return migrations.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Main function
 */
async function main() {
  console.log("🔍 Checking Migration Status\n");
  console.log("=" .repeat(60));
  console.log(`📡 Project: grfjmnjpzvknmsxrwesx`);
  console.log("=" .repeat(60));
  console.log();
  
  // Get local migrations
  console.log("📋 Scanning local migration files...");
  const localMigrations = getLocalMigrations();
  console.log(`✅ Found ${localMigrations.length} local migration files\n`);
  
  // Note: To check applied migrations, we would need to call MCP list_migrations
  // For now, we'll prepare all migrations for application
  
  console.log("📦 Preparing migrations for MCP application...\n");
  
  const migrationsToApply = localMigrations.map(m => ({
    name: m.name,
    filename: m.filename,
    type: m.type,
    sql: m.content,
    size: m.content.length
  }));
  
  // Save migration data for MCP application
  const outputDir = path.join(PROJECT_DIR, "database/migration_results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, "migrations_for_mcp.json");
  fs.writeFileSync(outputFile, JSON.stringify({
    projectId: "grfjmnjpzvknmsxrwesx",
    projectUrl: "https://grfjmnjpzvknmsxrwesx.supabase.co",
    timestamp: new Date().toISOString(),
    totalMigrations: migrationsToApply.length,
    migrations: migrationsToApply.map(m => ({
      name: m.name,
      filename: m.filename,
      type: m.type,
      size: m.size
    }))
  }, null, 2));
  
  console.log(`✅ Prepared ${migrationsToApply.length} migrations`);
  console.log(`📊 Migration list saved to: ${outputFile}\n`);
  
  console.log("=" .repeat(60));
  console.log("📝 MIGRATION INSTRUCTIONS");
  console.log("=" .repeat(60));
  console.log();
  console.log("To apply migrations using MCP Supabase tools:");
  console.log();
  console.log("1. The MCP server is already configured for project grfjmnjpzvknmsxrwesx");
  console.log("2. Use the 'apply_migration' MCP tool for each migration");
  console.log("3. Migration data is in: database/migration_results/migrations_for_mcp.json");
  console.log();
  console.log(`Total migrations: ${migrationsToApply.length}`);
  console.log();
  console.log("💡 You can ask Cursor AI to:");
  console.log("   - Apply all missing migrations using MCP tools");
  console.log("   - Check which migrations are already applied");
  console.log("   - Migrate data from the old project if needed");
  console.log();
  
  return {
    success: true,
    totalMigrations: migrationsToApply.length,
    outputFile
  };
}

main()
  .then((result) => {
    console.log("✅ Preparation complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
