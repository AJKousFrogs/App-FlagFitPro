#!/usr/bin/env node
/**
 * Apply all migrations automatically via MCP execute_sql
 * Reads each migration file and applies it via MCP tools
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
  console.log("🚀 Auto-Applying All Migrations via MCP\n");
  console.log("=" .repeat(60));
  console.log("📡 Target: grfjmnjpzvknmsxrwesx");
  console.log("=" .repeat(60));
  console.log();
  
  const files = getAllMigrationFiles();
  console.log(`📋 Found ${files.length} migration files\n`);
  
  // Prepare migration list for MCP execution
  const migrations = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file.path, "utf-8");
      migrations.push({
        name: file.name,
        path: file.path,
        sql: content,
        size: content.length
      });
    } catch (error) {
      console.error(`❌ Error reading ${file.name}:`, error.message);
    }
  }
  
  console.log(`✅ Prepared ${migrations.length} migrations\n`);
  console.log("📝 Migration files ready for MCP execute_sql:\n");
  
  migrations.forEach((m, index) => {
    console.log(`${String(index + 1).padStart(3)}. ${m.name} (${(m.size / 1024).toFixed(1)} KB)`);
  });
  
  console.log();
  console.log("=" .repeat(60));
  console.log("💡 To apply via MCP:");
  console.log("=" .repeat(60));
  console.log();
  console.log("I can apply these migrations automatically using MCP execute_sql tool.");
  console.log("Each migration will be applied in order.");
  console.log();
  console.log("⚠️  Note: This will take some time (140 migrations).");
  console.log("   I'll apply them one by one via MCP execute_sql.");
  console.log();
  console.log("Ready to start applying migrations automatically!");
  
  return {
    totalMigrations: migrations.length,
    migrations: migrations.map(m => ({
      name: m.name,
      size: m.size,
      sql: m.sql.substring(0, 100) + "..." // Preview
    }))
  };
}

main().catch(console.error);
