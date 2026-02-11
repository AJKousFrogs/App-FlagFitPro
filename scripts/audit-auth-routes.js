#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const NETLIFY_TOML = path.join(ROOT, "netlify.toml");
const API_SERVICE = path.join(
  ROOT,
  "angular/src/app/core/services/api.service.ts",
);
const API_DOCS_FN = path.join(ROOT, "netlify/functions/api-docs.js");
const FUNCTIONS_DIR = path.join(ROOT, "netlify/functions");

const authRouteContract = [
  {
    endpoint: "/api/auth/me",
    functionName: "auth-me",
    requiredIn: [API_SERVICE, API_DOCS_FN],
    compatibilityAliases: ["/auth-me", "/api/auth-me"],
  },
  {
    endpoint: "/api/auth/login",
    functionName: "auth-login",
    requiredIn: [API_DOCS_FN],
    compatibilityAliases: [],
  },
  {
    endpoint: "/api/auth/reset-password",
    functionName: "auth-reset-password",
    requiredIn: [],
    compatibilityAliases: [],
  },
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function hasExactRedirect(netlifyToml, fromPath, functionName) {
  const escapedFrom = fromPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedTo = `/.netlify/functions/${functionName}`.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const blockRegex = new RegExp(
    `\\[\\[redirects\\]\\][\\s\\S]*?from\\s*=\\s*"${escapedFrom}"[\\s\\S]*?to\\s*=\\s*"${escapedTo}"`,
    "m",
  );
  return blockRegex.test(netlifyToml);
}

function fileContainsLiteral(filePath, literal) {
  const content = read(filePath);
  return content.includes(literal);
}

function checkFunctionFile(functionName) {
  return fs.existsSync(path.join(FUNCTIONS_DIR, `${functionName}.js`));
}

function findLegacyAuthPathUsage(content) {
  const stalePatterns = [
    "/api/auth-login",
    "/api/auth-me",
    "/api/auth-reset-password",
  ];

  return stalePatterns.filter((pattern) => content.includes(pattern));
}

function main() {
  const failures = [];
  const warnings = [];

  const netlifyToml = read(NETLIFY_TOML);
  const apiServiceContent = read(API_SERVICE);
  const apiDocsContent = read(API_DOCS_FN);

  for (const route of authRouteContract) {
    if (!checkFunctionFile(route.functionName)) {
      failures.push(
        `Missing function file: netlify/functions/${route.functionName}.js`,
      );
    }

    if (!hasExactRedirect(netlifyToml, route.endpoint, route.functionName)) {
      failures.push(
        `Missing redirect: ${route.endpoint} -> /.netlify/functions/${route.functionName}`,
      );
    }

    for (const alias of route.compatibilityAliases) {
      if (!hasExactRedirect(netlifyToml, alias, route.functionName)) {
        warnings.push(
          `Missing compatibility redirect: ${alias} -> /.netlify/functions/${route.functionName}`,
        );
      }
    }

    for (const filePath of route.requiredIn) {
      if (!fileContainsLiteral(filePath, route.endpoint)) {
        failures.push(
          `Missing canonical endpoint '${route.endpoint}' in ${path.relative(ROOT, filePath)}`,
        );
      }
    }
  }

  const staleInDocs = findLegacyAuthPathUsage(apiDocsContent);
  for (const stale of staleInDocs) {
    failures.push(`Stale auth path found in api-docs: ${stale}`);
  }

  // API service should expose canonical auth me endpoint.
  if (!apiServiceContent.includes('me: "/api/auth/me"')) {
    failures.push(
      'API_ENDPOINTS.auth.me is not canonical. Expected: me: "/api/auth/me"',
    );
  }

  if (failures.length > 0) {
    console.error("❌ Auth route audit failed:");
    failures.forEach((item) => console.error(`  - ${item}`));
    if (warnings.length > 0) {
      console.error("\n⚠️ Warnings:");
      warnings.forEach((item) => console.error(`  - ${item}`));
    }
    process.exit(1);
  }

  console.log("✅ Auth route audit passed.");
  if (warnings.length > 0) {
    console.log("⚠️ Warnings:");
    warnings.forEach((item) => console.log(`  - ${item}`));
  }
}

main();
