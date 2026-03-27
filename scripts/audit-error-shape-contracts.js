#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, "netlify/functions");

function listFunctionFiles() {
  return fs
    .readdirSync(FUNCTIONS_DIR)
    .filter((name) => name.endsWith(".js"))
    .filter((name) => !name.startsWith("utils"))
    .map((name) => path.join(FUNCTIONS_DIR, name));
}

function hasExportedHandler(source) {
  return (
    /\bexport\s+const\s+handler\b/.test(source) ||
    /\bexport\s*\{\s*handler\b/.test(source) ||
    /\bexport\s+default\s+createRuntimeV2Handler\(\s*handler\s*\)/.test(source)
  );
}

function analyze(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const hasHandlerExport = hasExportedHandler(source);
  if (!hasHandlerExport) {
    return null;
  }

  const usesBaseHandler = source.includes("baseHandler(");
  const usesCreateHandler = source.includes("createHandler(");
  const usesCreateSuccess = source.includes("createSuccessResponse(");
  const usesCreateError = source.includes("createErrorResponse(");
  const rawStatusCodeCount = (source.match(/statusCode\s*:/g) || []).length;
  const rawResultBody = source.includes("JSON.stringify(result)");
  const rawSuccessLiteral = /success\s*:\s*true/.test(source);

  const handlerType =
    usesBaseHandler || usesCreateHandler ? "standardized" : "legacy";

  return {
    file: path.relative(ROOT, filePath),
    handlerType,
    usesCreateSuccess,
    usesCreateError,
    rawStatusCodeCount,
    rawResultBody,
    rawSuccessLiteral,
  };
}

function main() {
  const analyses = listFunctionFiles()
    .map(analyze)
    .filter(Boolean)
    .sort((a, b) => a.file.localeCompare(b.file));

  const legacy = analyses.filter((a) => a.handlerType === "legacy");
  const severe = legacy.filter((a) => !a.usesCreateError);
  const warnings = legacy.filter((a) => a.rawResultBody);

  console.log("Error Shape Contract Audit");
  console.log("==========================");
  console.log(`Handlers analyzed: ${analyses.length}`);
  console.log(`Standardized handlers: ${analyses.length - legacy.length}`);
  console.log(`Legacy handlers: ${legacy.length}`);

  if (legacy.length > 0) {
    console.log("\nLegacy handlers:");
    for (const item of legacy) {
      console.log(
        `- ${item.file} | createSuccess=${item.usesCreateSuccess} createError=${item.usesCreateError} rawStatus=${item.rawStatusCodeCount}`,
      );
    }
  }

  if (warnings.length > 0) {
    console.log("\nWarnings (raw JSON.stringify(result) payloads):");
    for (const item of warnings) {
      console.log(`- ${item.file}`);
    }
  }

  if (severe.length > 0) {
    console.error("\n❌ Severe issues:");
    for (const item of severe) {
      console.error(
        `- ${item.file}: legacy handler without createErrorResponse`,
      );
    }
    process.exit(1);
  }

  console.log("\n✅ No severe error-shape contract violations detected.");
}

main();
