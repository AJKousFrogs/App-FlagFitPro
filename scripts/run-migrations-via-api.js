/**
 * Migration Planner (API-safe)
 *
 * Supabase REST does not execute DDL directly.
 * This script builds an ordered migration plan and emits a consolidated SQL file
 * for manual SQL Editor / MCP execution.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_DIR = join(process.cwd());
const RESULTS_DIR = join(PROJECT_DIR, "database", "migration_results");
const MCP_DIR = join(RESULTS_DIR, "mcp_chunks");

const includeLegacy = process.env.INCLUDE_LEGACY_DATABASE_MIGRATIONS === "true";

function listSqlFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(dir, f));
}

function getMigrationFiles() {
  const files = listSqlFiles(join(PROJECT_DIR, "supabase", "migrations"));
  if (includeLegacy) {
    files.push(...listSqlFiles(join(PROJECT_DIR, "database", "migrations")));
  }
  return files;
}

function buildConsolidatedSql(files) {
  const header = [
    "-- Consolidated migration bundle",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Source-of-truth: supabase/migrations${includeLegacy ? " + database/migrations" : ""}`,
    "",
  ].join("\n");

  const parts = [header];
  for (const file of files) {
    const rel = file.replace(`${PROJECT_DIR}/`, "");
    parts.push(`-- ============================================================================`);
    parts.push(`-- ${rel}`);
    parts.push(`-- ============================================================================`);
    parts.push(readFileSync(file, "utf8").trim());
    parts.push("");
  }

  return parts.join("\n");
}

function main() {
  const files = getMigrationFiles();

  if (files.length === 0) {
    console.error("❌ No migration files found.");
    process.exit(1);
  }

  mkdirSync(RESULTS_DIR, { recursive: true });
  mkdirSync(MCP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const planPath = join(RESULTS_DIR, `migration_plan_${timestamp}.txt`);
  const consolidatedPath = join(MCP_DIR, `mcp_chunk_${timestamp}.sql`);
  const stableConsolidatedPath = join(RESULTS_DIR, "all_migrations_consolidated.sql");

  const bundle = buildConsolidatedSql(files);

  writeFileSync(planPath, files.map((f) => f.replace(`${PROJECT_DIR}/`, "")).join("\n"));
  writeFileSync(consolidatedPath, bundle);
  writeFileSync(stableConsolidatedPath, bundle);

  console.log("🚀 Migration Planning Complete\n");
  console.log(`Files in plan: ${files.length}`);
  console.log(`Plan file: ${planPath}`);
  console.log(`Stable bundle: ${stableConsolidatedPath}`);
  console.log(`MCP SQL bundle: ${consolidatedPath}`);
  console.log("\n⚠️  Execution note:");
  console.log("- Supabase REST API cannot run DDL migrations directly.");
  console.log("- Execute the generated SQL bundle via Supabase SQL Editor or MCP SQL execution.");
}

main();
