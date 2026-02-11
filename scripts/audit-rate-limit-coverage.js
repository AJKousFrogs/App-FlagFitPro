#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, "netlify/functions");
const VALID_RATE_LIMIT_TYPES = new Set([
  "READ",
  "CREATE",
  "AUTH",
  "DEFAULT",
  "UPDATE",
  "DELETE",
]);

function getFiles() {
  return fs
    .readdirSync(FUNCTIONS_DIR)
    .filter((name) => name.endsWith(".js"))
    .filter((name) => !name.startsWith("utils"))
    .map((name) => path.join(FUNCTIONS_DIR, name));
}

function parseAllowedMethods(source) {
  const match = source.match(/allowedMethods\s*:\s*\[([^\]]+)\]/);
  if (!match) {
    return [];
  }
  return [...match[1].matchAll(/"(GET|POST|PUT|PATCH|DELETE)"/g)].map(
    (m) => m[1],
  );
}

function parseRateLimitTypeLiteral(source) {
  const match = source.match(/rateLimitType\s*:\s*"([A-Z_]+)"/);
  return match ? match[1] : null;
}

function isMutating(methods) {
  return methods.some((m) => m !== "GET");
}

function analyze(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.includes("export const handler")) {
    return null;
  }

  const usesBase = source.includes("baseHandler(");
  const usesFactory = source.includes("createHandler(");
  const allowedMethods = parseAllowedMethods(source);
  const rateLiteral = parseRateLimitTypeLiteral(source);
  const hasRateConfig = source.includes("rateLimitType:");
  const mutating = isMutating(allowedMethods);

  return {
    file: path.relative(ROOT, filePath),
    usesBase,
    usesFactory,
    allowedMethods,
    rateLiteral,
    hasRateConfig,
    mutating,
  };
}

function main() {
  const findings = getFiles().map(analyze).filter(Boolean);

  const severe = [];
  const warnings = [];

  for (const item of findings) {
    const wrapped = item.usesBase || item.usesFactory;
    if (!wrapped) {
      warnings.push(`${item.file}: legacy handler (rate-limit coverage manual)`);
      continue;
    }

    if (!item.hasRateConfig) {
      warnings.push(
        `${item.file}: no explicit rateLimitType (falls back to READ/defaults)`,
      );
    }

    if (item.rateLiteral && !VALID_RATE_LIMIT_TYPES.has(item.rateLiteral)) {
      severe.push(
        `${item.file}: invalid rateLimitType '${item.rateLiteral}' (allowed: ${Array.from(
          VALID_RATE_LIMIT_TYPES,
        ).join(", ")})`,
      );
    }

    if (item.mutating && item.rateLiteral === "READ") {
      warnings.push(
        `${item.file}: mutating allowedMethods with READ rateLimitType`,
      );
    }
  }

  console.log("Rate Limit Coverage Audit");
  console.log("=========================");
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

  console.log("\n✅ No severe rate-limit coverage issues detected.");
}

main();
