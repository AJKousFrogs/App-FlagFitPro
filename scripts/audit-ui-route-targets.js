#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "angular/src/app");
const ROUTE_GROUPS_DIR = path.join(APP_DIR, "core/routes/groups");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listFiles(dir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.(ts|html)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function collectRoutePaths() {
  const paths = new Set();
  const files = fs
    .readdirSync(ROUTE_GROUPS_DIR)
    .filter((file) => file.endsWith(".ts"))
    .sort();

  for (const file of files) {
    const source = read(path.join(ROUTE_GROUPS_DIR, file));
    for (const match of source.matchAll(/path:\s*"([^"]+)"/g)) {
      const routePath = match[1];
      if (!routePath || routePath === "**") {
        continue;
      }
      paths.add(normalizeRoute(`/${routePath}`.replace(/\/+/g, "/")));
    }
  }

  return paths;
}

function normalizeRoute(route) {
  if (!route?.startsWith("/")) {
    return null;
  }

  let normalized = route.trim();
  normalized = normalized.replace(/\?.*$/, "");
  normalized = normalized.replace(/#.*$/, "");
  normalized = normalized.replace(/\/:(\w+)/g, "/*");
  normalized = normalized.replace(/\/\[(\w+)\]/g, "/*");
  normalized = normalized.replace(/\{[^}]+\}/g, "*");
  normalized = normalized.replace(/\/+/g, "/");
  normalized = normalized.replace(/\/$/, "");

  return normalized || "/";
}

function matchesKnownRoute(target, knownRoutes) {
  if (knownRoutes.has(target)) {
    return true;
  }

  return Array.from(knownRoutes).some((route) => {
    if (!route.endsWith("/*")) {
      return false;
    }
    const base = route.slice(0, -2);
    return target === base || target.startsWith(`${base}/`);
  });
}

function collectStaticTargets(filePath) {
  const source = read(filePath);
  const targets = [];
  const patterns = [
    /\brouterLink="(\/[^"]+)"/g,
    /\[routerLink\]="\['(\/[^']+)'/g,
    /\bnavigate\(\["(\/[^"]+)"/g,
    /\bnavigate\(\["(\/[^"]+)"\s*,\s*[^[]+\]\)/g,
    /\bnavigateByUrl\("(\/[^"]+)"/g,
    /\bhref="(\/[^"]+)"/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const route = normalizeRoute(match[1]);
      if (!route || route === "/") {
        continue;
      }
      if (pattern.source.includes('\\bnavigate\\(\\["') && match[0].includes(",")) {
        targets.push(`${route}/*`);
        continue;
      }
      targets.push(route);
    }
  }

  return targets;
}

function main() {
  const knownRoutes = collectRoutePaths();
  const files = listFiles(APP_DIR);
  const missing = [];

  for (const filePath of files) {
    const relative = path.relative(ROOT, filePath);
    const targets = collectStaticTargets(filePath);
    for (const target of targets) {
      if (!matchesKnownRoute(target, knownRoutes)) {
        missing.push(`${target} (${relative})`);
      }
    }
  }

  const uniqueMissing = [...new Set(missing)].sort();

  console.log("UI Route Target Audit");
  console.log("=====================");
  console.log(`Known route paths: ${knownRoutes.size}`);

  if (uniqueMissing.length > 0) {
    console.error("\nBroken or unknown static route targets:");
    for (const item of uniqueMissing) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("\nAll static CTA/navigation route targets map to registered routes.");
}

main();
