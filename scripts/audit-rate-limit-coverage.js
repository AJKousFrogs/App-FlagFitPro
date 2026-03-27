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

function hasExportedHandler(source) {
  return (
    /\bexport\s+const\s+handler\b/.test(source) ||
    /\bexport\s*\{\s*handler\b/.test(source) ||
    /\bexport\s+default\s+createRuntimeV2Handler\(\s*handler\s*\)/.test(source)
  );
}

function isMutating(methods) {
  return methods.some((m) => m !== "GET");
}

function parseHandlerConfigs(source) {
  const allowedMatches = [...source.matchAll(/allowedMethods\s*:\s*\[([^\]]+)\]/g)];

  return allowedMatches.map((match, index) => {
    const methods = [
      ...match[1].matchAll(/"(GET|POST|PUT|PATCH|DELETE)"/g),
    ].map((methodMatch) => methodMatch[1]);
    const currentIndex = match.index ?? 0;
    const nextIndex = allowedMatches[index + 1]?.index ?? Number.POSITIVE_INFINITY;
    const blockSource = source.slice(currentIndex, nextIndex);
    const rateLiteralMatch = blockSource.match(
      /rateLimitType\s*:\s*"([A-Z_]+)"/,
    );
    const rateConfigMatch =
      rateLiteralMatch ||
      blockSource.match(/rateLimitType\s*:\s*[^,\n]+/) ||
      blockSource.match(/\brateLimitType\s*,/);

    return {
      allowedMethods: methods,
      hasRateConfig: Boolean(rateConfigMatch),
      rateLiteral: rateLiteralMatch?.[1] || null,
    };
  });
}

function analyze(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!hasExportedHandler(source)) {
    return null;
  }

  const usesBase = source.includes("baseHandler(");
  const usesFactory = source.includes("createHandler(");
  const configs = parseHandlerConfigs(source);

  return {
    file: path.relative(ROOT, filePath),
    usesBase,
    usesFactory,
    configs,
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

    if (item.configs.length === 0) {
      warnings.push(`${item.file}: no allowedMethods config detected`);
      continue;
    }

    for (const config of item.configs) {
      if (!config.hasRateConfig) {
        warnings.push(
          `${item.file}: no explicit rateLimitType for [${config.allowedMethods.join(", ")}]`,
        );
      }

      if (
        config.rateLiteral &&
        !VALID_RATE_LIMIT_TYPES.has(config.rateLiteral)
      ) {
        severe.push(
          `${item.file}: invalid rateLimitType '${config.rateLiteral}' for [${config.allowedMethods.join(", ")}] (allowed: ${Array.from(
            VALID_RATE_LIMIT_TYPES,
          ).join(", ")})`,
        );
      }

      if (
        isMutating(config.allowedMethods) &&
        config.rateLiteral === "READ"
      ) {
        warnings.push(
          `${item.file}: mutating allowedMethods [${config.allowedMethods.join(", ")}] with READ rateLimitType`,
        );
      }
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
