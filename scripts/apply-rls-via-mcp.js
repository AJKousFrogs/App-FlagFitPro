#!/usr/bin/env node

/**
 * Script to apply RLS migration via Supabase MCP
 * This reads the SQL file and applies it using the MCP tool
 */

const fs = require("fs");
const path = require("path");

const sqlFile = path.join(
  __dirname,
  "../database/apply-rls-policies-all-missing-tables.sql",
);
const sql = fs.readFileSync(sqlFile, "utf8");

console.log(`Loaded SQL file: ${sql.length} characters`);
console.log("Note: This script requires manual execution via MCP tool");
console.log("SQL content ready to apply");

// Export for use in other scripts if needed
if (require.main === module) {
  console.log(
    "\nTo apply this migration, use the Supabase MCP execute_sql tool with this content.",
  );
  process.exit(0);
}

module.exports = { sql };
