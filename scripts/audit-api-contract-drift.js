#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NETLIFY_TOML = path.join(ROOT, "netlify.toml");
const FUNCTIONS_DIR = path.join(ROOT, "netlify/functions");
const API_DOCS_FILE = path.join(ROOT, "netlify/functions/api-docs.js");
const API_MARKDOWN_FILE = path.join(ROOT, "docs/API.md");
const FRONTEND_DIR = path.join(ROOT, "angular/src");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listFiles(dir, extension) {
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile() && fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function normalizeRoute(route) {
  if (!route || !route.startsWith("/api/")) {
    return null;
  }

  let normalized = route.trim();
  normalized = normalized.replace(/\?.*$/, "");
  normalized = normalized.replace(/\{[^}]+\}/g, "*");
  normalized = normalized.replace(/\/:(\w+)/g, "/*");
  normalized = normalized.replace(/\/\[(\w+)\]/g, "/*");
  normalized = normalized.replace(/\/+/g, "/");
  normalized = normalized.replace(/\/$/, "");

  return normalized;
}

function routeMatches(pattern, actualRoute) {
  const normalizedPattern = normalizeRoute(pattern);
  const normalizedActual = normalizeRoute(actualRoute);
  if (!normalizedPattern || !normalizedActual) {
    return false;
  }

  if (normalizedPattern === normalizedActual) {
    return true;
  }

  if (normalizedPattern.endsWith("/*")) {
    const base = normalizedPattern.slice(0, -2);
    return normalizedActual === base || normalizedActual.startsWith(`${base}/`);
  }

  return false;
}

function parseRedirects() {
  const source = read(NETLIFY_TOML);
  const redirects = [];
  const blockRegex = /\[\[redirects\]\]([\s\S]*?)(?=\n\[\[redirects\]\]|\n\[[^\]]|\s*$)/g;

  for (const match of source.matchAll(blockRegex)) {
    const block = match[1];
    const fromMatch = block.match(/^\s*from = "([^"]+)"/m);
    const toMatch = block.match(/^\s*to = "([^"]+)"/m);

    if (!fromMatch || !toMatch) {
      continue;
    }

    const from = fromMatch[1];
    if (!from.startsWith("/api/")) {
      continue;
    }

    const to = toMatch[1];
    const functionMatch = to.match(/\/\.netlify\/functions\/([^/?]+)/);
    redirects.push({
      from: normalizeRoute(from),
      to,
      functionName: functionMatch ? functionMatch[1] : null,
    });
  }

  return redirects;
}

function parseFunctionMethods() {
  const methodsByFunction = new Map();
  const files = fs
    .readdirSync(FUNCTIONS_DIR)
    .filter((name) => name.endsWith(".js"))
    .filter((name) => !name.startsWith("_"));

  for (const fileName of files) {
    const source = read(path.join(FUNCTIONS_DIR, fileName));
    const functionName = fileName.replace(/\.js$/, "");

    const arrayMatches = [
      ...source.matchAll(/allowedMethods:\s*\[([^\]]*)\]/g),
    ];
    if (arrayMatches.length > 0) {
      const methods = new Set();
      for (const match of arrayMatches) {
        for (const part of match[1].split(",")) {
          const method = part.replace(/['"\s]/g, "");
          if (method) {
            methods.add(method);
          }
        }
      }
      methodsByFunction.set(functionName, Array.from(methods).sort());
      continue;
    }

    if (source.includes("baseHandler(")) {
      methodsByFunction.set(functionName, ["GET"]);
      continue;
    }

    methodsByFunction.set(functionName, []);
  }

  return methodsByFunction;
}

function parseApiDocs() {
  const source = read(API_DOCS_FILE);
  const docs = [];
  const entryRegex =
    /"([^"]+)":\s*\{[\s\S]*?\bpath:\s*"([^"]+)"[\s\S]*?\bmethod:\s*"([^"]+)"[\s\S]*?\}/g;

  for (const match of source.matchAll(entryRegex)) {
    docs.push({
      key: match[1],
      path: normalizeRoute(match[2]),
      methods: match[3]
        .split(",")
        .map((method) => method.trim().toUpperCase())
        .filter(Boolean)
        .sort(),
    });
  }

  return docs;
}

function parseApiMarkdown() {
  const source = read(API_MARKDOWN_FILE);
  const docs = [];
  const tableRowRegex = /^\|\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\|\s*`([^`]+)`\s*\|/gm;

  for (const match of source.matchAll(tableRowRegex)) {
    docs.push({
      method: match[1].toUpperCase(),
      path: normalizeRoute(match[2]),
    });
  }

  return docs;
}

function parseFrontendRoutes() {
  const files = listFiles(FRONTEND_DIR, ".ts");
  const routes = new Map();
  const routeRegex = /\/api\/[A-Za-z0-9\-_/:[\]?=&.]+/g;

  for (const filePath of files) {
    const source = read(filePath);
    for (const match of source.matchAll(routeRegex)) {
      const rawRoute = match[0];
      const route = normalizeRoute(rawRoute);
      if (!route) {
        continue;
      }
      const relativePath = path.relative(ROOT, filePath);
      if (!routes.has(route)) {
        routes.set(route, new Set());
      }
      routes.get(route).add(relativePath);
    }
  }

  return routes;
}

function isApiCatalogOnlyRoute(files) {
  return files.every((filePath) => filePath.endsWith("angular/src/app/core/services/api.service.ts"));
}

function firstMatchingRedirect(route, redirects) {
  return (
    redirects
      .filter((redirect) => routeMatches(redirect.from, route))
      .sort((left, right) => right.from.length - left.from.length)[0] || null
  );
}

function methodsEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function hasSiblingWildcardRedirect(redirect, redirects) {
  if (!redirect?.functionName) {
    return false;
  }

  const base = redirect.from.replace(/\/\*$/, "");
  return redirects.some((candidate) => {
    if (candidate === redirect) {
      return false;
    }
    if (candidate.functionName !== redirect.functionName) {
      return false;
    }
    const candidateBase = candidate.from.replace(/\/\*$/, "");
    return candidateBase === base;
  });
}

function reportList(title, items) {
  console.log(`\n${title}`);
  console.log("=".repeat(title.length));
  if (items.length === 0) {
    console.log("None");
    return;
  }

  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function main() {
  const redirects = parseRedirects();
  const methodsByFunction = parseFunctionMethods();
  const apiDocs = parseApiDocs();
  const apiMarkdown = parseApiMarkdown();
  const frontendRoutes = parseFrontendRoutes();

  const missingRedirectFunctions = redirects
    .filter(
      (redirect) =>
        redirect.functionName && !methodsByFunction.has(redirect.functionName),
    )
    .map(
      (redirect) =>
        `${redirect.from} -> ${redirect.functionName} (missing function file)`,
    );

  const undocumentedApiDocsRoutes = apiDocs
    .filter((entry) => !firstMatchingRedirect(entry.path, redirects))
    .map((entry) => `${entry.path} (${entry.methods.join(", ")})`);

  const apiDocsMethodDrifts = apiDocs
    .map((entry) => {
      const redirect = firstMatchingRedirect(entry.path, redirects);
      if (!redirect?.functionName) {
        return null;
      }

      if (hasSiblingWildcardRedirect(redirect, redirects)) {
        return null;
      }

      const actualMethods = methodsByFunction.get(redirect.functionName) || [];
      if (actualMethods.length === 0) {
        return null;
      }

      if (methodsEqual(entry.methods, actualMethods)) {
        return null;
      }

      return `${entry.path}: api-docs=${entry.methods.join(", ")} function=${actualMethods.join(", ")} (${redirect.functionName}.js)`;
    })
    .filter(Boolean);

  const markdownMethodDrifts = apiMarkdown
    .map((entry) => {
      if (!entry.path) {
        return null;
      }

      const redirect = firstMatchingRedirect(entry.path, redirects);
      if (!redirect?.functionName) {
        return `${entry.method} ${entry.path}: documented in docs/API.md but no redirect exists`;
      }

      if (hasSiblingWildcardRedirect(redirect, redirects)) {
        return null;
      }

      const actualMethods = methodsByFunction.get(redirect.functionName) || [];
      if (actualMethods.length === 0 || actualMethods.includes(entry.method)) {
        return null;
      }

      return `${entry.method} ${entry.path}: docs/API.md mismatches ${redirect.functionName}.js (${actualMethods.join(", ")})`;
    })
    .filter(Boolean);

  const frontendRouteDrifts = Array.from(frontendRoutes.entries())
    .map(([route, files]) => {
      if (isApiCatalogOnlyRoute(Array.from(files))) {
        return null;
      }
      if (firstMatchingRedirect(route, redirects)) {
        return null;
      }
      return `${route} (used by ${Array.from(files).join(", ")})`;
    })
    .filter(Boolean)
    .sort();

  const apiCatalogRouteInventory = Array.from(frontendRoutes.entries())
    .map(([route, files]) => {
      const fileList = Array.from(files);
      if (!isApiCatalogOnlyRoute(fileList)) {
        return null;
      }
      if (firstMatchingRedirect(route, redirects)) {
        return null;
      }
      return `${route} (defined in ${fileList.join(", ")})`;
    })
    .filter(Boolean)
    .sort();

  const missingApiDocsForRedirects = redirects
    .filter((redirect) => !redirect.from.includes("*"))
    .filter(
      (redirect) =>
        !apiDocs.some((entry) => routeMatches(entry.path, redirect.from)),
    )
    .map((redirect) => `${redirect.from} -> ${redirect.functionName || redirect.to}`);

  const summary = {
    redirects: redirects.length,
    functions: methodsByFunction.size,
    apiDocsEntries: apiDocs.length,
    markdownRows: apiMarkdown.length,
    frontendRoutes: frontendRoutes.size,
    problems:
      missingRedirectFunctions.length +
      undocumentedApiDocsRoutes.length +
      apiDocsMethodDrifts.length +
      markdownMethodDrifts.length +
      0,
  };

  console.log("API Contract Drift Audit");
  console.log("========================");
  console.log(
    `Redirects: ${summary.redirects} | Functions: ${summary.functions} | API docs: ${summary.apiDocsEntries} | Markdown rows: ${summary.markdownRows} | Frontend routes: ${summary.frontendRoutes}`,
  );

  reportList("Redirects Pointing To Missing Functions", missingRedirectFunctions);
  reportList("API Docs Paths Missing Redirect Coverage", undocumentedApiDocsRoutes);
  reportList("API Docs Method Drift", apiDocsMethodDrifts);
  reportList("docs/API.md Drift", markdownMethodDrifts);
  reportList(
    "Frontend Routes Missing Redirect Coverage (Inventory Warning)",
    frontendRouteDrifts,
  );
  reportList(
    "API Endpoint Catalog Missing Redirect Coverage (Definition Inventory)",
    apiCatalogRouteInventory,
  );
  reportList(
    "Redirects Missing API Docs Entries (Coverage Warning)",
    missingApiDocsForRedirects,
  );

  if (summary.problems > 0) {
    console.error(`\nDrift detected: ${summary.problems} problem(s).`);
    process.exit(1);
  }

  console.log("\nNo API contract drift detected.");
}

main();
