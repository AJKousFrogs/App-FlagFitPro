#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROJECT_DIR = process.cwd();
const TARGETS = [
  "supabase/migrations",
  "database/migrations",
  "database",
];
const EXCLUDE_PREFIXES = [
  "database/migration_results/",
  "database/schemas/",
];

function listSqlFiles() {
  const files = [];

  for (const relDir of TARGETS) {
    const absDir = join(PROJECT_DIR, relDir);
    if (!existsSync(absDir)) {
      continue;
    }

    const entries = readdirSync(absDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".sql")) {
        continue;
      }
      const relPath = join(relDir, entry.name).replaceAll("\\", "/");
      if (EXCLUDE_PREFIXES.some((p) => relPath.startsWith(p))) {
        continue;
      }
      files.push(relPath);
    }
  }

  return [...new Set(files)].sort();
}

function collectFindings(filePath, sql) {
  const findings = [];

  if (/\bDROP\s+TABLE\b[\s\S]*\bCASCADE\b/i.test(sql)) {
    findings.push({ severity: "high", type: "destructive_drop_table", detail: "DROP TABLE ... CASCADE found" });
  }

  if (/\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i.test(sql)) {
    findings.push({ severity: "medium", type: "non_idempotent_create_table", detail: "CREATE TABLE without IF NOT EXISTS" });
  }

  if (/\bCREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)/i.test(sql)) {
    findings.push({ severity: "medium", type: "non_idempotent_create_index", detail: "CREATE INDEX without IF NOT EXISTS" });
  }

  if (/\bCREATE\s+POLICY\b/i.test(sql) && !/\bDROP\s+POLICY\s+IF\s+EXISTS\b/i.test(sql)) {
    findings.push({ severity: "low", type: "policy_recreate_risk", detail: "CREATE POLICY without DROP POLICY IF EXISTS" });
  }

  const definerMatches = [...sql.matchAll(/SECURITY\s+DEFINER/gi)];
  if (definerMatches.length > 0 && !/SET\s+search_path\s*=|SET\s+search_path\s*=\s*''/i.test(sql)) {
    findings.push({ severity: "high", type: "definer_missing_search_path", detail: "SECURITY DEFINER found without explicit SET search_path" });
  }

  if (/^\s*CREATE\s+OR\s+REPLACE\s+VIEW\s+/im.test(sql) && !/security_invoker\s*=\s*true/i.test(sql)) {
    findings.push({ severity: "low", type: "view_not_security_invoker", detail: "VIEW does not declare security_invoker=true" });
  }

  return findings;
}

function scoreSeverity(findings) {
  return findings.reduce(
    (acc, f) => {
      acc.total += 1;
      acc[f.severity] += 1;
      return acc;
    },
    { total: 0, high: 0, medium: 0, low: 0 },
  );
}

function main() {
  const files = listSqlFiles();
  const results = [];
  const supabaseFiles = files.filter((f) => f.startsWith("supabase/migrations/"));
  const legacyFiles = files.filter((f) => f.startsWith("database/migrations/"));

  const supabaseByBase = new Set(supabaseFiles.map((f) => f.split("/").pop()));
  const overlappingBasenames = legacyFiles
    .map((f) => f.split("/").pop())
    .filter((base) => supabaseByBase.has(base))
    .sort();

  for (const relPath of files) {
    const absPath = join(PROJECT_DIR, relPath);
    const sql = readFileSync(absPath, "utf8");
    const findings = collectFindings(relPath, sql);
    if (findings.length > 0) {
      results.push({ file: relPath, findings });
    }
  }

  const summary = scoreSeverity(results.flatMap((r) => r.findings));

  const reportLines = [];
  reportLines.push("# SQL Migration Audit");
  reportLines.push("");
  reportLines.push(`Generated: ${new Date().toISOString()}`);
  reportLines.push(`SQL files scanned: ${files.length}`);
  reportLines.push(`Files with findings: ${results.length}`);
  reportLines.push(`Findings: high=${summary.high}, medium=${summary.medium}, low=${summary.low}, total=${summary.total}`);
  reportLines.push(`Supabase migrations: ${supabaseFiles.length}`);
  reportLines.push(`Legacy database migrations: ${legacyFiles.length}`);
  reportLines.push(`Overlapping migration basenames: ${overlappingBasenames.length}`);
  if (overlappingBasenames.length > 0) {
    reportLines.push("");
    reportLines.push("## Overlapping Basenames");
    for (const base of overlappingBasenames) {
      reportLines.push(`- ${base}`);
    }
  }
  reportLines.push("");

  const top = [...results]
    .sort((a, b) => b.findings.length - a.findings.length)
    .slice(0, 30);

  reportLines.push("## Top Files");
  for (const item of top) {
    reportLines.push(`- ${item.file} (${item.findings.length} findings)`);
  }
  reportLines.push("");
  reportLines.push("## Detailed Findings");
  for (const item of results) {
    reportLines.push(`- ${item.file}`);
    for (const f of item.findings) {
      reportLines.push(`  - [${f.severity}] ${f.type}: ${f.detail}`);
    }
  }

  const outDir = join(PROJECT_DIR, "docs", "reports");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "supabase-sql-audit.md");
  writeFileSync(outPath, `${reportLines.join("\n")}\n`);

  console.log("SQL Migration Audit");
  console.log("===================");
  console.log(`SQL files scanned: ${files.length}`);
  console.log(`Files with findings: ${results.length}`);
  console.log(`Findings -> high: ${summary.high}, medium: ${summary.medium}, low: ${summary.low}, total: ${summary.total}`);
  console.log(`Supabase migrations: ${supabaseFiles.length}`);
  console.log(`Legacy database migrations: ${legacyFiles.length}`);
  console.log(`Overlapping migration basenames: ${overlappingBasenames.length}`);
  console.log(`Report: ${outPath}`);
}

main();
