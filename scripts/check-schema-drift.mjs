#!/usr/bin/env node
/**
 * Schema-drift guard for Netlify Functions.
 *
 * Why this exists: the functions query Supabase with stringly-typed column names
 * (.eq("col"), .order("col"), …). A column that doesn't exist in the live schema
 * either throws (hard drift → 500, e.g. the return_to_play_protocols.is_active
 * bug) or returns silently-empty results (soft drift). JS gives no compile-time
 * safety, so this script provides it at build time.
 *
 * What it does:
 *   1. Extracts every filter/order column reference per `.from("table")` chain
 *      from netlify/functions/**.js (the operators that hard-throw on a missing
 *      column: eq/neq/gt/gte/lt/lte/in/like/ilike/is/order/contains/overlaps).
 *   2. Diffs them against the live public schema (information_schema.columns),
 *      fetched via the Supabase REST API using SUPABASE_URL + a service/anon key.
 *   3. Fails (exit 1) on any drift that is NOT in scripts/schema-drift-baseline.json
 *      — so pre-existing drift is tolerated (ratchet) but NEW drift breaks the build.
 *
 * No DB creds (e.g. a fork PR)? It skips with a warning, like the other
 * DB-dependent suites (test:privacy / test:acwr) — never a false failure.
 *
 * Refresh the baseline after you FIX a drift: `node scripts/check-schema-drift.mjs --update-baseline`.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FUNC_DIR = join(ROOT, "netlify/functions");
const BASELINE_PATH = join(__dirname, "schema-drift-baseline.json");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Supabase query operators whose first string arg is a column and that HARD-THROW
// (or silently mis-filter) when the column is absent.
const OP = "eq|neq|gt|gte|lt|lte|in|like|ilike|is|order|contains|overlaps";
const TOKEN = new RegExp(
  // .from("literal")  |  .from(<variable>)  |  .op("col")
  `\\.from\\(\\s*(["'])([a-zA-Z0-9_]+)\\1\\s*\\)|\\.from\\(\\s*[A-Za-z_$]|\\.(${OP})\\(\\s*["']([a-zA-Z_][a-zA-Z0-9_]*)["']`,
  "g",
);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

/** Extract { "table.column": ["file:line", …] } of filter/order references. */
function extractRefs() {
  const refs = {};
  for (const path of walk(FUNC_DIR)) {
    const txt = readFileSync(path, "utf8");
    const rel = path.slice(ROOT.length + 1);
    let last = null;
    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(txt))) {
      if (m[2]) {
        last = m[2]; // .from("literal")
      } else if (m[0].startsWith(".from(")) {
        last = null; // .from(variable) → don't associate following ops (avoids false positives)
      } else if (m[4] && last) {
        const line = txt.slice(0, m.index).split("\n").length;
        const key = `${last}.${m[4]}`;
        (refs[key] ||= []).push(`${rel}:${line}`);
      }
    }
  }
  return refs;
}

async function fetchSchema() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  // Read-only introspection RPC (migration app_schema_columns_introspection_rpc).
  // Returns {table_name: [column_name, …]} for the public schema. service_role only.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/app_schema_columns`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) {
    throw new Error(
      `app_schema_columns RPC returned ${res.status} ${await res.text()}`,
    );
  }
  return res.json();
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const refs = extractRefs();

  const schema = await fetchSchema();
  if (!schema) {
    console.warn(
      "⚠️  schema-drift: SUPABASE_URL + a service key are not set — skipping the " +
        "live diff (same self-skip as test:privacy / test:acwr). Set them to run " +
        "the guard against the live schema.",
    );
    process.exit(0);
  }

  const valid = new Set();
  for (const [table, cols] of Object.entries(schema)) {
    for (const c of cols) valid.add(`${table}.${c}`);
  }
  const knownTables = new Set(Object.keys(schema));

  const drift = [];
  for (const [key, sites] of Object.entries(refs)) {
    const [table, col] = key.split(".");
    if (!knownTables.has(table)) {
      drift.push({ key, kind: "ghost_table", sites });
    } else if (!valid.has(key)) {
      drift.push({ key, kind: "missing_column", sites });
    }
  }

  if (args.has("--update-baseline")) {
    const baseline = Object.fromEntries(drift.map((d) => [d.key, d.sites]));
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
    console.log(`✓ baseline updated: ${drift.length} known drifts`);
    process.exit(0);
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  const newDrift = drift.filter((d) => !(d.key in baseline));
  const fixed = Object.keys(baseline).filter(
    (k) => !drift.some((d) => d.key === k),
  );

  if (fixed.length) {
    console.log(
      `ℹ️  ${fixed.length} baselined drift(s) are now resolved — run ` +
        `--update-baseline to tighten the guard:\n   ${fixed.join("\n   ")}`,
    );
  }

  if (newDrift.length) {
    console.error(
      "\n✘ NEW schema drift — code references columns/tables that do not exist:\n",
    );
    for (const d of newDrift) {
      console.error(
        `  [${d.kind}] ${d.key}\n      ${d.sites.join("\n      ")}`,
      );
    }
    console.error(
      `\n${newDrift.length} new drift(s). Fix the query to match the live schema, ` +
        `or add the column via migration. See scripts/check-schema-drift.mjs.\n`,
    );
    process.exit(1);
  }

  console.log(
    `✓ schema-drift: no new drift (${Object.keys(refs).length} refs checked, ` +
      `${Object.keys(baseline).length} pre-existing drifts baselined).`,
  );
}

main().catch((e) => {
  console.error("schema-drift check failed to run:", e.message);
  process.exit(1);
});
