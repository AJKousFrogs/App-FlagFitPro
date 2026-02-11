#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, "netlify/functions");
const PUBLIC_WRITE_ALLOWLIST = new Set([
  "netlify/functions/knowledge-search.js", // public query-count telemetry updates
]);

function getFiles() {
  return fs
    .readdirSync(FUNCTIONS_DIR)
    .filter((name) => name.endsWith(".js"))
    .filter((name) => !name.startsWith("utils"))
    .map((name) => path.join(FUNCTIONS_DIR, name));
}

function extractRequireAuth(source) {
  const match = source.match(/requireAuth\s*:\s*(true|false)/);
  return match ? match[1] : "unknown";
}

function hasManualAuth(source) {
  return (
    source.includes("authenticateRequest(event)") ||
    source.includes("authenticateRequest(")
  );
}

function hasWriteOps(source) {
  const writePatterns = [".insert(", ".update(", ".delete(", ".upsert("];
  return writePatterns.some((pattern) => source.includes(pattern));
}

function analyze(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.includes("export const handler")) {
    return null;
  }
  if (!source.includes("supabaseAdmin")) {
    return null;
  }

  const usesBaseHandler = source.includes("baseHandler(");
  const usesCreateHandler = source.includes("createHandler(");
  const requireAuth = extractRequireAuth(source);
  const manualAuth = hasManualAuth(source);
  const writes = hasWriteOps(source);
  const hasMixedRequireAuth =
    source.includes("requireAuth: false") && source.includes("requireAuth: true");

  return {
    file: path.relative(ROOT, filePath),
    usesBaseHandler,
    usesCreateHandler,
    requireAuth,
    manualAuth,
    writes,
    hasMixedRequireAuth,
  };
}

function main() {
  const findings = getFiles().map(analyze).filter(Boolean);

  const severe = [];
  const warnings = [];

  for (const item of findings) {
    if (
      !item.usesBaseHandler &&
      !item.usesCreateHandler &&
      !item.manualAuth &&
      item.writes
    ) {
      severe.push(
        `${item.file}: supabaseAdmin writes with no baseHandler/createHandler and no explicit authenticateRequest`,
      );
    }

    if (item.requireAuth === "false" && item.writes) {
      if (item.manualAuth || item.hasMixedRequireAuth) {
        warnings.push(
          `${item.file}: supabaseAdmin writes with requireAuth=false (manual/mixed auth flow detected)`,
        );
      } else if (PUBLIC_WRITE_ALLOWLIST.has(item.file)) {
        warnings.push(
          `${item.file}: public write path allowlisted (verify telemetry-only behavior remains true)`,
        );
      } else {
        severe.push(
          `${item.file}: supabaseAdmin writes while requireAuth=false`,
        );
      }
    }

    if (item.requireAuth === "unknown") {
      warnings.push(
        `${item.file}: supabaseAdmin in legacy/manual handler (requireAuth not statically enforced)`,
      );
    }
  }

  console.log("RLS Boundary Audit");
  console.log("==================");
  console.log(`Supabase admin handlers analyzed: ${findings.length}`);

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (severe.length > 0) {
    console.error("\n❌ Severe issues:");
    for (const issue of severe) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log("\n✅ No severe RLS boundary issues detected.");
}

main();
