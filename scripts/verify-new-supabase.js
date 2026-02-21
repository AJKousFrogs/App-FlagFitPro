#!/usr/bin/env node
/**
 * Verify new Supabase project connection and readiness
 * Checks if the new project is accessible and ready for migration
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load dotenv if available (optional dependency)
try {
  const dotenv = await import("dotenv");
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    dotenv.default.config({ path: envPath });
  }
} catch (e) {
  // dotenv not available, use environment variables directly
}

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

console.log("🔍 Verifying New Supabase Project Connection\n");
console.log(`📡 URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY ? "✓ Set" : "✗ Missing"}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}\n`);

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required",
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyConnection() {
  console.log("1️⃣ Testing Connection...");
  try {
    // Test basic connection
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      // Table might not exist yet (migrations not run)
      if (
        error.code === "PGRST116" ||
        error.message.includes("does not exist")
      ) {
        console.log(
          "   ⚠️  Connection works, but 'users' table doesn't exist yet",
        );
        console.log(
          "   📋 This is expected if migrations haven't been run yet\n",
        );
        return { connected: true, tablesExist: false };
      }
      throw error;
    }

    console.log("   ✅ Connected successfully");
    console.log(`   ✅ 'users' table exists\n`);
    return { connected: true, tablesExist: true };
  } catch (error) {
    console.error(`   ❌ Connection failed: ${error.message}`);
    return { connected: false, tablesExist: false };
  }
}

async function checkTables() {
  console.log("2️⃣ Checking Core Tables...");

  const coreTables = [
    "users",
    "teams",
    "players",
    "training_sessions",
    "games",
    "positions",
  ];

  const results = {};

  for (const table of coreTables) {
    try {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        if (error.code === "PGRST116") {
          results[table] = "missing";
        } else {
          results[table] = `error: ${error.message}`;
        }
      } else {
        results[table] = "exists";
      }
    } catch (err) {
      results[table] = `error: ${err.message}`;
    }
  }

  let existsCount = 0;
  for (const [table, status] of Object.entries(results)) {
    if (status === "exists") {
      console.log(`   ✅ ${table}`);
      existsCount++;
    } else if (status === "missing") {
      console.log(`   ⚠️  ${table} (not found)`);
    } else {
      console.log(`   ❌ ${table} (${status})`);
    }
  }

  console.log(
    `\n   Summary: ${existsCount}/${coreTables.length} core tables exist\n`,
  );
  return existsCount;
}

async function checkMigrations() {
  console.log("3️⃣ Checking Migration Status...");

  try {
    // Check if schema_migrations table exists (common migration tracking)
    const { error: schemaError } = await supabase
      .from("schema_migrations")
      .select("version")
      .limit(1);

    if (schemaError && schemaError.code === "PGRST116") {
      console.log("   ⚠️  No migration tracking table found");
      console.log(
        "   📋 This is normal - migrations may use a different system\n",
      );
      return false;
    }

    const { data } = await supabase.from("schema_migrations").select("version");

    if (data && data.length > 0) {
      console.log(`   ✅ Found ${data.length} migration records`);
      console.log(
        `   Latest: ${data[data.length - 1]?.version || "unknown"}\n`,
      );
      return true;
    } else {
      console.log("   ⚠️  Migration table exists but is empty\n");
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not check migrations: ${error.message}\n`);
    return false;
  }
}

async function main() {
  const connection = await verifyConnection();

  if (!connection.connected) {
    console.error("\n❌ Cannot proceed - connection failed");
    console.error("\n📋 Troubleshooting:");
    console.error("1. Verify SUPABASE_URL is correct");
    console.error("2. Verify SUPABASE_SERVICE_KEY is valid");
    console.error("3. Check network connectivity");
    console.error("4. Verify project is active in Supabase dashboard");
    process.exit(1);
  }

  const tableCount = await checkTables();
  const hasMigrations = await checkMigrations();

  console.log("=".repeat(50));
  console.log("📊 Verification Summary");
  console.log("=".repeat(50));
  console.log(
    `Connection: ${connection.connected ? "✅ Working" : "❌ Failed"}`,
  );
  console.log(`Core Tables: ${tableCount}/6 exist`);
  console.log(
    `Migrations: ${hasMigrations ? "✅ Tracked" : "⚠️  Not tracked"}`,
  );
  console.log("=".repeat(50));

  if (tableCount === 0) {
    console.log("\n📋 Next Steps:");
    console.log("1. Run database migrations:");
    console.log("   ./scripts/run-all-migrations-supabase.sh");
    console.log("\n2. Or run migrations via Supabase Dashboard:");
    console.log(
      "   https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql",
    );
  } else if (tableCount < 6) {
    console.log(
      "\n⚠️  Some tables are missing. You may need to run migrations.",
    );
  } else {
    console.log("\n✅ Project appears ready for data migration!");
    console.log("\n📋 Next Steps:");
    console.log("1. Verify all migrations are applied");
    console.log("2. Run data migration:");
    console.log("   node scripts/migrate-supabase-data.js");
  }
}

main().catch((error) => {
  console.error("\n❌ Verification failed:", error);
  process.exit(1);
});
