#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NAV_CONFIG_FILE = path.join(
  ROOT,
  "angular/src/app/core/navigation/app-navigation.config.ts",
);
const ROUTE_GROUPS_DIR = path.join(ROOT, "angular/src/app/core/routes/groups");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function collectRoutePaths() {
  const paths = new Set();
  const files = fs
    .readdirSync(ROUTE_GROUPS_DIR)
    .filter((file) => file.endsWith(".ts"))
    .sort();

  for (const file of files) {
    const source = read(path.join(ROUTE_GROUPS_DIR, file));
    const matches = source.matchAll(/path:\s*"([^"]+)"/g);
    for (const match of matches) {
      const routePath = match[1];
      if (!routePath || routePath === "**") {
        continue;
      }
      paths.add(`/${routePath}`.replace(/\/+/g, "/"));
    }
  }

  return paths;
}

function collectNavigationRoutes() {
  const source = read(NAV_CONFIG_FILE);
  const routes = [];
  const itemRegex =
    /label:\s*"([^"]+)"[\s\S]*?route:\s*"([^"]+)"[\s\S]*?group:\s*"([^"]+)"/g;

  for (const match of source.matchAll(itemRegex)) {
    routes.push({
      label: match[1],
      route: match[2],
      group: match[3],
    });
  }

  return routes;
}

function main() {
  const routePaths = collectRoutePaths();
  const navRoutes = collectNavigationRoutes();

  const missing = navRoutes.filter((item) => !routePaths.has(item.route));

  console.log("Navigation Route Audit");
  console.log("======================");
  console.log(
    `Navigation items: ${navRoutes.length} | Registered route paths: ${routePaths.size}`,
  );

  if (missing.length > 0) {
    console.error("\nBroken navigation targets:");
    for (const item of missing) {
      console.error(`- ${item.label}: ${item.route} (${item.group})`);
    }
    process.exit(1);
  }

  console.log("\nAll navigation targets map to registered routes.");
}

main();
