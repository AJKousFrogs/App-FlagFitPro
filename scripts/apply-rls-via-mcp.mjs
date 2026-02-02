#!/usr/bin/env node

/**
 * Script to apply RLS migration via Supabase MCP
 * This reads the SQL file and applies it using the MCP tool
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlFile = join(
  __dirname,
  "../database/apply-rls-policies-all-missing-tables.sql",
);
const sql = readFileSync(sqlFile, "utf8");

console.log(`Loaded SQL file: ${sql.length} characters`);
console.log("\nTo apply this migration via Supabase MCP, use:");
console.log("  - Tool: apply_migration");
console.log("  - Name: apply_rls_policies_all_missing_tables");
console.log("  - Query: (the SQL content from the file)");
console.log("\nThe migration file is ready at:", sqlFile);
