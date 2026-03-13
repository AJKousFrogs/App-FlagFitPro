#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, "netlify/functions");

function listFiles() {
  return fs
    .readdirSync(FUNCTIONS_DIR)
    .filter((name) => name.endsWith(".js"))
    .filter((name) => !name.startsWith("utils"))
    .map((name) => path.join(FUNCTIONS_DIR, name));
}

function hasDbUsage(source) {
  return (
    source.includes('.from("') ||
    source.includes(".from('") ||
    source.includes(".rpc(")
  );
}

function usesResilientPath(source) {
  const importsSupabaseClient =
    source.includes('from "./supabase-client.js"') ||
    source.includes("from './supabase-client.js'");
  const importsAuthHelper =
    source.includes('from "./utils/auth-helper.js"') ||
    source.includes("from './utils/auth-helper.js'");
  const importsBaseHandler =
    source.includes('from "./utils/base-handler.js"') ||
    source.includes("from './utils/base-handler.js'");
  const usesExecuteQuery = source.includes("executeQuery(");
  const usesAuthHelperClient = source.includes("getSupabaseClient(");
  const usesBaseHandler = source.includes("baseHandler(");
  return (
    importsSupabaseClient ||
    (importsBaseHandler && usesBaseHandler) ||
    (importsAuthHelper && usesAuthHelperClient) ||
    usesExecuteQuery
  );
}

function analyze(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.includes("export const handler")) {
    return null;
  }

  const dbUsage = hasDbUsage(source);
  const resilient = usesResilientPath(source);
  const usesBaseHandler = source.includes("baseHandler(");
  const hasErrorContext =
    source.includes("createErrorResponse(") || source.includes("handleServerError(");

  return {
    file: path.relative(ROOT, filePath),
    dbUsage,
    resilient,
    usesBaseHandler,
    hasErrorContext,
  };
}

function main() {
  const findings = listFiles().map(analyze).filter(Boolean);

  const severe = [];
  const warnings = [];

  for (const item of findings) {
    if (!item.dbUsage) {continue;}

    if (!item.resilient) {
      severe.push(
        `${item.file}: DB usage detected without resilient supabase-client/executeQuery path`,
      );
    }

    if (!item.hasErrorContext) {
      warnings.push(
        `${item.file}: DB usage detected without standardized error helpers`,
      );
    }

    if (!item.usesBaseHandler) {
      warnings.push(
        `${item.file}: DB usage in legacy handler (manual resilience/error handling)`,
      );
    }
  }

  console.log("DB Resilience Audit");
  console.log("===================");
  console.log(`Handlers analyzed: ${findings.length}`);

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

  console.log("\n✅ No severe DB resilience issues detected.");
}

main();
