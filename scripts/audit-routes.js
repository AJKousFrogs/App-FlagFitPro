#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROUTES_FILE = path.resolve(
  "angular/src/app/core/routes/feature-routes.ts",
);

const allowedEntries = new Set(["deeplink", "hub", "internal"]);

function readRoutesFile() {
  return fs.readFileSync(ROUTES_FILE, "utf8");
}

function parseRouteObjects(source) {
  const stack = [];
  const endByStart = new Map();
  const routes = new Map();

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") {
      stack.push(i);
      continue;
    }

    if (char === "}") {
      const start = stack.pop();
      if (typeof start === "number") {
        endByStart.set(start, i);
      }
      continue;
    }

    if (source.startsWith("path", i)) {
      const pathMatch = source.slice(i).match(/^path\s*:\s*["']([^"']+)["']/);
      if (!pathMatch) continue;
      const pathValue = pathMatch[1];
      const start = stack[stack.length - 1];
      if (typeof start !== "number") continue;
      if (!routes.has(start)) {
        routes.set(start, { path: pathValue, start });
      }
    }
  }

  const routeObjects = [];
  for (const [start, route] of routes.entries()) {
    const end = endByStart.get(start);
    if (typeof end !== "number") continue;
    routeObjects.push({ ...route, end, source: source.slice(start, end + 1) });
  }

  return routeObjects;
}

function auditEntryClassification(routes) {
  const missing = [];
  const invalid = [];

  for (const route of routes) {
    if (route.path === "**") continue;
    const match = route.source.match(/\bentry\s*:\s*["'](deeplink|hub|internal)["']/);
    if (!match) {
      missing.push(route.path);
      continue;
    }

    const entryValue = match[1];
    if (!allowedEntries.has(entryValue)) {
      invalid.push({ path: route.path, entry: entryValue });
    }
  }

  return { missing, invalid };
}

function main() {
  const source = readRoutesFile();
  const routes = parseRouteObjects(source);
  const { missing, invalid } = auditEntryClassification(routes);

  if (invalid.length > 0) {
    console.error("❌ Invalid entry classifications detected:");
    invalid.forEach((item) => {
      console.error(`  - ${item.path}: ${item.entry}`);
    });
    process.exitCode = 1;
  }

  if (missing.length > 0) {
    console.error("❌ Routes missing data.entry classification:");
    missing.forEach((pathValue) => console.error(`  - ${pathValue}`));
    process.exitCode = 1;
  }

  if (missing.length === 0 && invalid.length === 0) {
    console.log("✅ All routes include a valid data.entry classification.");
  }
}

main();
