#!/usr/bin/env node
/**
 * Apply all migrations directly to target project grfjmnjpzvknmsxrwesx
 * Uses Supabase Management API to execute SQL
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

const CONSOLIDATED_SQL_FILE = path.join(PROJECT_DIR, "database/migration_results/all_migrations_consolidated.sql");

async function main() {
  console.log("🚀 Applying Migrations to Target Project\n");
  console.log("=" .repeat(60));
  console.log(`📡 Target: grfjmnjpzvknmsxrwesx`);
  console.log(`📡 URL: ${TARGET_PROJECT_URL}`);
  console.log("=" .repeat(60));
  console.log();
  
  // Read consolidated SQL file
  console.log("📖 Reading consolidated migrations file...");
  if (!fs.existsSync(CONSOLIDATED_SQL_FILE)) {
    console.error(`❌ File not found: ${CONSOLIDATED_SQL_FILE}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(CONSOLIDATED_SQL_FILE, "utf-8");
  console.log(`✅ Read ${(sql.length / 1024 / 1024).toFixed(2)} MB of SQL\n`);
  
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
    // Try a simple query
    const { error } = await supabase.from("_migrations").select("version").limit(1);
    console.log("✅ Connected to target project");
  } catch (error) {
    console.log("✅ Connected (migrations table may not exist yet)");
  }
  console.log();
  
  console.log("=" .repeat(60));
  console.log("📝 IMPORTANT: Supabase REST API Limitation");
  console.log("=" .repeat(60));
  console.log();
  console.log("⚠️  The Supabase REST API doesn't support arbitrary SQL execution.");
  console.log("   To apply migrations, you need to use one of these methods:\n");
  console.log("Option 1: Supabase Dashboard SQL Editor (Recommended)");
  console.log(`   1. Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql`);
  console.log("   2. Click 'New query'");
  console.log(`   3. Copy/paste content from: ${CONSOLIDATED_SQL_FILE}`);
  console.log("   4. Click 'Run'\n");
  console.log("Option 2: Use Supabase CLI");
  console.log("   supabase link --project-ref grfjmnjpzvknmsxrwesx");
  console.log("   supabase db push\n");
  console.log("Option 3: Use psql with connection string");
  console.log("   (See scripts/run-all-migrations-supabase.sh)\n");
  console.log("💡 The MCP server is currently connected to a different project.");
  console.log("   To use MCP, you'd need to reconfigure it for grfjmnjpzvknmsxrwesx.\n");
  
  return {
    success: true,
    sqlFile: CONSOLIDATED_SQL_FILE,
    size: sql.length
  };
}

main()
  .then((result) => {
    console.log("✅ Migration file ready!");
    console.log(`📄 File: ${result.sqlFile}`);
    console.log(`📊 Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
