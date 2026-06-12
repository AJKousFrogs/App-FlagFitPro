#!/usr/bin/env node
/**
 * docs-regen — regenerate the GENERATED documentation sections from ground truth.
 *
 * Ground truth (offline, no DB creds):
 *   - Data model  ← supabase-types.ts  (generated from live Supabase schema)
 *   - Endpoints   ← netlify.toml redirects + netlify/functions/*.js
 *   - Exercised?  ← references to each /api path under angular/src
 *   - DRIFT flag  ← table present in live types but in NO migration file
 *
 * Outputs (overwritten each run, never hand-edit):
 *   - docs/generated/DATA_MODEL.md
 *   - docs/generated/ENDPOINTS.md
 *
 * Refresh freshness: regenerate Supabase types first (Supabase MCP
 * generate_typescript_types, or the CLI), then `npm run docs:regen`.
 *
 * Usage: node scripts/docs-regen.mjs   (or: npm run docs:regen)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = join(ROOT, "docs", "generated");

// Names that appear in `.from(...)` but are NOT public tables (Storage buckets).
const STORAGE_BUCKETS = new Set(["database-backups", "community-media", "avatars", "team-logos"]);

// ── LIVE schema snapshot (ground truth) ─────────────────────────────────────
// docs/generated/live-schema.snapshot.json is captured from live Supabase
// introspection (information_schema). It is the offline ground truth for the
// data model. Refresh it by re-running the introspection (Supabase MCP) — see
// the "Refresh" note in DATA_MODEL.md — then `npm run docs:regen`.
function loadLive() {
  const snap = JSON.parse(readFileSync(join(OUT_DIR, "live-schema.snapshot.json"), "utf8"));
  return { tables: snap.tables, views: snap.views, generatedOn: snap.generatedOn };
}

// ── supabase-types.ts table names — ONLY to measure its drift vs live ───────
// The file is JSON-wrapped: {"types":"<TS source with \n escapes>"}.
function typesTableNames() {
  const raw = readFileSync(join(ROOT, "supabase-types.ts"), "utf8");
  let text;
  try { text = JSON.parse(raw).types ?? raw; } catch { text = raw; }
  const names = new Set();
  let section = null;
  for (const line of text.split("\n")) {
    if (/^ {4}Tables: \{/.test(line)) { section = "Tables"; continue; }
    if (/^ {4}(Views|Functions|Enums|CompositeTypes): \{/.test(line)) { section = null; continue; }
    if (section !== "Tables") continue;
    const m = line.match(/^ {6}([A-Za-z0-9_]+): \{/);
    if (m) names.add(m[1]);
  }
  return names;
}

// ── Parse netlify.toml redirects: /api/... -> function name ─────────────────
function parseRedirects() {
  const text = readFileSync(join(ROOT, "netlify.toml"), "utf8");
  const fnPaths = {}; // function -> Set(paths)
  const blocks = text.split(/\[\[redirects\]\]/);
  for (const b of blocks) {
    const from = b.match(/from\s*=\s*"(\/api\/[^"]*)"/);
    const to = b.match(/to\s*=\s*"\/\.netlify\/functions\/([^/"]+)/);
    if (from && to) {
      (fnPaths[to[1]] ||= new Set()).add(from[1]);
    }
  }
  return fnPaths;
}

// ── Per-function: methods, tables, rpcs, paths, exercised ───────────────────
function parseFunctions(fnPaths) {
  const dir = join(ROOT, "netlify", "functions");
  const files = readdirSync(dir).filter((f) => f.endsWith(".js") && f !== "supabase-client.js" && f !== "validation.js");
  // All /api references in the Angular frontend (one grep, reused).
  let feRefs = "";
  try { feRefs = execSync(`grep -rhoE "/api/[A-Za-z0-9/_-]+" angular/src || true`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString(); } catch { /* none */ }
  const fns = [];
  for (const file of files) {
    const name = file.replace(/\.js$/, "");
    const src = readFileSync(join(dir, file), "utf8");
    // methods
    let methods = [];
    const am = src.match(/allowedMethods:\s*\[([^\]]*)\]/);
    if (am) methods = [...am[1].matchAll(/"([A-Z]+)"/g)].map((m) => m[1]);
    else {
      const hm = new Set([...src.matchAll(/httpMethod\s*===?\s*"([A-Z]+)"/g)].map((m) => m[1]));
      [...src.matchAll(/req\.method\s*===?\s*"([A-Z]+)"/g)].forEach((m) => hm.add(m[1]));
      methods = [...hm];
    }
    // tables + rpcs
    const tables = new Set([...src.matchAll(/\.from\(\s*["'`]([A-Za-z0-9_-]+)["'`]/g)].map((m) => m[1]));
    const rpcs = new Set([...src.matchAll(/\.rpc\(\s*["'`]([A-Za-z0-9_]+)["'`]/g)].map((m) => m[1]));
    // router submodule? imported by another function
    const importedBy = execSafe(`grep -rl 'from "\\./${name}\\.js"' netlify/functions/*.js | grep -v '${file}' | head -1`);
    const paths = [...(fnPaths[name] || [])];
    // exercised: any own /api path prefix referenced in the frontend, OR it's a router submodule
    const exercised = paths.some((p) => feRefs.includes(p.replace(/\/\*$/, ""))) || Boolean(importedBy);
    fns.push({ name, methods, tables, rpcs, paths, exercised, submodule: Boolean(importedBy) });
  }
  return fns;
}

function execSafe(cmd) {
  try { return execSync(cmd, { cwd: ROOT }).toString().trim(); } catch { return ""; }
}

// ── Tables present in live types but in NO migration file ───────────────────
function migrationMentions() {
  let blob = "";
  for (const d of ["database/migrations", "supabase/migrations"]) {
    const abs = join(ROOT, d);
    let files = [];
    try { files = readdirSync(abs).filter((f) => f.endsWith(".sql")); } catch { continue; }
    for (const f of files) blob += "\n" + readFileSync(join(abs, f), "utf8");
  }
  return blob;
}

// ── Generate ────────────────────────────────────────────────────────────────
function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const { tables, views, generatedOn } = loadLive();
  const typesNames = typesTableNames();
  const liveNames = new Set(Object.keys(tables));
  const staleInTypes = [...typesNames].filter((n) => !liveNames.has(n)).sort();    // in types, dropped from live
  const missingFromTypes = [...liveNames].filter((n) => !typesNames.has(n)).sort(); // live, types not regenerated
  const fnPaths = parseRedirects();
  const fns = parseFunctions(fnPaths);
  const migBlob = migrationMentions();

  // table -> endpoints that touch it
  const tableEndpoints = {};
  for (const fn of fns) for (const t of fn.tables) (tableEndpoints[t] ||= new Set()).add(fn.name);

  const tableNames = Object.keys(tables).sort();
  const driftTables = tableNames.filter((t) => !new RegExp(`\\b${t}\\b`).test(migBlob));

  // ── DATA_MODEL.md ──
  let dm = `# Data Model (GENERATED — do not hand-edit)\n\n`;
  dm += `> Regenerate: \`npm run docs:regen\` (reads \`docs/generated/live-schema.snapshot.json\`).\n`;
  dm += `> Refresh against live: re-run the Supabase introspection into that snapshot (Supabase MCP), then rerun.\n`;
  dm += `> **Schema snapshot (live): ${generatedOn}** · doc regenerated: ${TODAY}\n\n`;
  dm += `**${tableNames.length} base tables, ${Object.keys(views).length} views.** Tables flagged \`DRIFT\` exist live but are not defined in any migration file.\n\n`;
  if (staleInTypes.length || missingFromTypes.length) {
    dm += `> ⚠️ **\`supabase-types.ts\` is STALE vs live — regenerate it.** In types but dropped from live (${staleInTypes.length}): ${staleInTypes.map((t) => `\`${t}\``).join(", ") || "—"}. Live but missing from types (${missingFromTypes.length}): ${missingFromTypes.map((t) => `\`${t}\``).join(", ") || "—"}.\n\n`;
  }
  if (driftTables.length) dm += `**DRIFT (live, no migration file):** ${driftTables.map((t) => `\`${t}\``).join(", ")}\n\n`;
  dm += `## Tables\n\n`;
  for (const t of tableNames) {
    const eps = [...(tableEndpoints[t] || [])].sort();
    dm += `### \`${t}\`${driftTables.includes(t) ? " — ⚠️ DRIFT" : ""}\n`;
    dm += `Touched by: ${eps.length ? eps.map((e) => `\`${e}\``).join(", ") : "_(no endpoint references this table)_"}\n\n`;
    for (const { col, type, nullable } of tables[t]) dm += `- \`${col}\` ${type}${nullable ? "" : " · not null"}\n`;
    dm += `\n`;
  }
  dm += `## Views\n\n`;
  for (const v of Object.keys(views).sort()) {
    dm += `### \`${v}\` (view)\n`;
    for (const { col, type, nullable } of views[v]) dm += `- \`${col}\` ${type}${nullable ? "" : " · not null"}\n`;
    dm += `\n`;
  }
  writeFileSync(join(OUT_DIR, "DATA_MODEL.md"), dm);

  // ── ENDPOINTS.md ──
  const exercised = fns.filter((f) => f.exercised).sort((a, b) => a.name.localeCompare(b.name));
  const orphaned = fns.filter((f) => !f.exercised).sort((a, b) => a.name.localeCompare(b.name));
  const liveTableSet = new Set([...tableNames, ...Object.keys(views)]); // views are valid .from() targets too
  const row = (f) => {
    const t = [...f.tables].map((x) =>
      STORAGE_BUCKETS.has(x) ? `${x} _(bucket)_` : (liveTableSet.has(x) ? x : `${x} ⚠️`),
    );
    const r = [...f.rpcs].map((x) => `${x}()`);
    const touched = [...t, ...r].join(", ") || "—";
    const paths = f.paths.length ? f.paths.join("<br>") : (f.submodule ? "_(router submodule)_" : "_(no /api redirect)_");
    return `| \`${f.name}\` | ${f.methods.join(", ") || "—"} | ${paths} | ${touched} |`;
  };
  let ep = `# Endpoint Reference (GENERATED — do not hand-edit)\n\n`;
  ep += `> Regenerate: \`npm run docs:regen\` (parses \`netlify.toml\` + \`netlify/functions/*.js\` + scans \`angular/src\`).\n`;
  ep += `> **Last verified: ${TODAY}**\n\n`;
  ep += `**${fns.length} functions: ${exercised.length} exercised, ${orphaned.length} orphaned.** `;
  ep += `A table name with ⚠️ is referenced in code but not a live table (possible drift/typo); _(bucket)_ = Storage bucket, not a DB table.\n\n`;
  ep += `## Exercised\n\n| Function | Methods | /api path(s) | Tables / RPCs touched |\n|---|---|---|---|\n`;
  ep += exercised.map(row).join("\n") + "\n\n";
  ep += `## Orphaned (no frontend reference — do NOT rebuild; verify before reuse)\n\n| Function | Methods | /api path(s) | Tables / RPCs touched |\n|---|---|---|---|\n`;
  ep += (orphaned.map(row).join("\n") || "| _(none)_ | | | |") + "\n";
  writeFileSync(join(OUT_DIR, "ENDPOINTS.md"), ep);

  // stdout summary (the three rot numbers feed the report)
  const unknownTableRefs = new Set();
  for (const f of fns) for (const x of f.tables) if (!liveTableSet.has(x) && !STORAGE_BUCKETS.has(x)) unknownTableRefs.add(x);
  console.log(`DATA_MODEL: ${tableNames.length} tables, ${Object.keys(views).length} views, ${driftTables.length} DRIFT`);
  console.log(`types staleness: ${staleInTypes.length} stale-in-types, ${missingFromTypes.length} live-missing-from-types`);
  console.log(`ENDPOINTS:  ${fns.length} functions, ${exercised.length} exercised, ${orphaned.length} ORPHANED -> ${orphaned.map((o) => o.name).join(", ")}`);
  console.log(`DRIFT tables: ${driftTables.join(", ") || "(none)"}`);
  console.log(`Unknown table refs (⚠️ verify): ${[...unknownTableRefs].join(", ") || "(none)"}`);
}

main();
