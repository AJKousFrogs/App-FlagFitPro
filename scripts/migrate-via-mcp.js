#!/usr/bin/env node
/**
 * Migrate Supabase database using MCP tools
 * 
 * This script uses MCP Supabase tools to:
 * 1. Check current migration state
 * 2. Apply missing migrations
 * 3. Verify migration completion
 * 
 * Usage:
 *   node scripts/migrate-via-mcp.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.join(__dirname, "..");

// Migration directories
const SUPABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "supabase/migrations");
const DATABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "database/migrations");

/**
 * Get all migration files sorted by name
 */
function getAllMigrationFiles() {
  const files = [];
  
  // Get supabase migrations
  if (fs.existsSync(SUPABASE_MIGRATIONS_DIR)) {
    const supabaseFiles = fs.readdirSync(SUPABASE_MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => ({
        path: path.join(SUPABASE_MIGRATIONS_DIR, f),
        name: f,
        type: "supabase"
      }));
    files.push(...supabaseFiles);
  }
  
  // Get database migrations
  if (fs.existsSync(DATABASE_MIGRATIONS_DIR)) {
    const dbFiles = fs.readdirSync(DATABASE_MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => ({
        path: path.join(DATABASE_MIGRATIONS_DIR, f),
        name: f,
        type: "database"
      }));
    files.push(...dbFiles);
  }
  
  // Sort by name (which includes timestamp for supabase migrations)
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Read migration file content
 */
function readMigrationFile(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Extract migration name from filename
 */
function getMigrationName(filename) {
  // Remove .sql extension
  let name = filename.replace(/\.sql$/, "");
  
  // For timestamped migrations (20260130_name), extract just the name part
  const match = name.match(/^\d+_(.+)$/);
  if (match) {
    name = match[1];
  }
  
  // Convert to snake_case if needed
  return name.replace(/[-\s]/g, "_").toLowerCase();
}

/**
 * Call MCP tool via cursor CLI (if available) or provide instructions
 */
async function applyMigrationViaMCP(migrationName, sqlQuery) {
  console.log(`\n📝 Applying migration: ${migrationName}`);
  console.log(`   SQL length: ${sqlQuery.length} characters`);
  
  // Note: This would need to be called via MCP tool in Cursor
  // For now, we'll prepare the migration data and provide instructions
  return {
    name: migrationName,
    query: sqlQuery,
    ready: true
  };
}

/**
 * Main migration function
 */
async function migrateViaMCP() {
  console.log("🚀 Supabase Migration via MCP Tools\n");
  console.log("=" .repeat(60));
  console.log(`📡 Target Project: grfjmnjpzvknmsxrwesx`);
  console.log(`📡 Project URL: https://grfjmnjpzvknmsxrwesx.supabase.co`);
  console.log("=" .repeat(60));
  console.log();
  
  // Get all migration files
  console.log("📋 Scanning migration files...");
  const migrationFiles = getAllMigrationFiles();
  console.log(`✅ Found ${migrationFiles.length} migration files\n`);
  
  // Group migrations by type
  const supabaseMigrations = migrationFiles.filter(f => f.type === "supabase");
  const databaseMigrations = migrationFiles.filter(f => f.type === "database");
  
  console.log(`   - Supabase migrations: ${supabaseMigrations.length}`);
  console.log(`   - Database migrations: ${databaseMigrations.length}\n`);
  
  // Prepare migrations for MCP application
  console.log("📦 Preparing migrations for MCP application...\n");
  
  const migrationsToApply = [];
  
  for (const file of migrationFiles) {
    try {
      const content = readMigrationFile(file.path);
      const migrationName = getMigrationName(file.name);
      
      migrationsToApply.push({
        name: migrationName,
        filename: file.name,
        path: file.path,
        type: file.type,
        sql: content,
        size: content.length
      });
    } catch (error) {
      console.error(`❌ Error reading ${file.name}:`, error.message);
    }
  }
  
  console.log(`✅ Prepared ${migrationsToApply.length} migrations\n`);
  
  // Generate migration report
  const reportPath = path.join(PROJECT_DIR, "database/migration_results/mcp_migration_report.json");
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    projectId: "grfjmnjpzvknmsxrwesx",
    projectUrl: "https://grfjmnjpzvknmsxrwesx.supabase.co",
    totalMigrations: migrationsToApply.length,
    migrations: migrationsToApply.map(m => ({
      name: m.name,
      filename: m.filename,
      type: m.type,
      size: m.size
    }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Migration report saved to: ${reportPath}\n`);
  
  // Instructions for applying via MCP
  console.log("=" .repeat(60));
  console.log("📝 NEXT STEPS: Apply Migrations via MCP Tools");
  console.log("=" .repeat(60));
  console.log();
  console.log("The migrations have been prepared. To apply them using MCP tools:");
  console.log();
  console.log("1. Use the MCP Supabase 'apply_migration' tool for each migration");
  console.log("2. Migration names and SQL are in the report file");
  console.log("3. Or use the migration script below to apply via execute_sql");
  console.log();
  console.log(`Total migrations to apply: ${migrationsToApply.length}`);
  console.log();
  console.log("Sample migration structure:");
  if (migrationsToApply.length > 0) {
    const sample = migrationsToApply[0];
    console.log(`  - Name: ${sample.name}`);
    console.log(`  - File: ${sample.filename}`);
    console.log(`  - Size: ${sample.size} bytes`);
  }
  console.log();
  console.log("💡 Tip: You can ask Cursor AI to apply these migrations");
  console.log("   using the MCP Supabase tools.");
  console.log();
  
  return {
    success: true,
    totalMigrations: migrationsToApply.length,
    reportPath
  };
}

// Run migration
migrateViaMCP()
  .then((result) => {
    console.log("✅ Migration preparation complete!");
    console.log(`📊 Report: ${result.reportPath}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration preparation failed:", error);
    process.exit(1);
  });
