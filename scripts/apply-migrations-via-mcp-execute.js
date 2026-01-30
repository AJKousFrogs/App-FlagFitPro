#!/usr/bin/env node
/**
 * Apply migrations using MCP execute_sql tool
 * This script prepares migrations to be applied via MCP tools
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_DIR = path.join(__dirname, "..");

const SUPABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "supabase/migrations");
const DATABASE_MIGRATIONS_DIR = path.join(PROJECT_DIR, "database/migrations");

function getAllMigrationFiles() {
  const files = [];
  
  if (fs.existsSync(SUPABASE_MIGRATIONS_DIR)) {
    const supabaseFiles = fs.readdirSync(SUPABASE_MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => ({
        path: path.join(SUPABASE_MIGRATIONS_DIR, f),
        name: f,
        type: "supabase"
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    files.push(...supabaseFiles);
  }
  
  if (fs.existsSync(DATABASE_MIGRATIONS_DIR)) {
    const dbFiles = fs.readdirSync(DATABASE_MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => ({
        path: path.join(DATABASE_MIGRATIONS_DIR, f),
        name: f,
        type: "database"
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    files.push(...dbFiles);
  }
  
  return files;
}

async function main() {
  console.log("📋 Preparing migrations for MCP execute_sql tool\n");
  
  const files = getAllMigrationFiles();
  console.log(`Found ${files.length} migration files\n`);
  
  // Create a consolidated SQL file with all migrations
  const outputDir = path.join(PROJECT_DIR, "database/migration_results");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const consolidatedFile = path.join(outputDir, "all_migrations_consolidated.sql");
  let consolidatedSQL = "-- Consolidated Migrations for grfjmnjpzvknmsxrwesx\n";
  consolidatedSQL += `-- Generated: ${new Date().toISOString()}\n`;
  consolidatedSQL += `-- Total migrations: ${files.length}\n\n`;
  
  console.log("📦 Consolidating migrations...\n");
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file.path, "utf-8");
      consolidatedSQL += `\n-- ============================================================================\n`;
      consolidatedSQL += `-- Migration: ${file.name}\n`;
      consolidatedSQL += `-- Type: ${file.type}\n`;
      consolidatedSQL += `-- ============================================================================\n\n`;
      consolidatedSQL += content;
      consolidatedSQL += `\n\n`;
      console.log(`  ✅ Added: ${file.name}`);
    } catch (error) {
      console.error(`  ❌ Error reading ${file.name}:`, error.message);
    }
  }
  
  fs.writeFileSync(consolidatedFile, consolidatedSQL);
  
  console.log(`\n✅ Consolidated ${files.length} migrations`);
  console.log(`📄 File: ${consolidatedFile}`);
  console.log(`📊 Size: ${(consolidatedSQL.length / 1024 / 1024).toFixed(2)} MB\n`);
  
  console.log("=" .repeat(60));
  console.log("📝 NEXT STEPS");
  console.log("=" .repeat(60));
  console.log();
  console.log("To apply migrations using MCP execute_sql tool:");
  console.log();
  console.log("1. Read the consolidated file:");
  console.log(`   cat ${consolidatedFile}`);
  console.log();
  console.log("2. Use MCP execute_sql tool with the SQL content");
  console.log("   (Note: Large SQL files may need to be split into batches)");
  console.log();
  console.log("OR use Supabase Dashboard:");
  console.log("1. Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql");
  console.log("2. Click 'New query'");
  console.log(`3. Copy/paste content from: ${consolidatedFile}`);
  console.log("4. Run the query");
  console.log();
}

main().catch(console.error);
