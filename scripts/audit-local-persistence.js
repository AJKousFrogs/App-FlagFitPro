#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createLogger } from "../netlify/functions/utils/structured-logger.js";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "angular/src/app");

const ALLOWED_PATTERNS = [
  {
    pattern: /onboarding-state\.service\.ts/,
    reason: "Onboarding draft-only local cache",
  },
  {
    pattern: /settings-save-settings\.service\.ts/,
    reason: "Local cache written only after successful Supabase save",
  },
  {
    pattern: /game-tracker\.component\.ts/,
    reason: "Temperature unit UI preference",
  },
  {
    pattern: /main-layout\.component\.ts/,
    reason: "Sidebar collapsed UI preference",
  },
  {
    pattern: /sidebar\.component\.ts/,
    reason: "Sidebar expansion UI preference",
  },
  {
    pattern: /search\.service\.ts/,
    reason: "Recent-search UI convenience cache",
  },
  {
    pattern: /feature-flags\.service\.ts/,
    reason: "Developer feature-flag preference",
  },
  {
    pattern: /cookie-consent\.service\.ts/,
    reason: "Cookie consent preference",
  },
  {
    pattern: /theme\.service\.ts/,
    reason: "Theme preference with Supabase sync support",
  },
];

const logger = createLogger({
  service: "local_persistence_audit",
});

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
      } else if (
        entry.isFile() &&
        /\.(ts|html)$/.test(entry.name) &&
        !entry.name.endsWith(".spec.ts")
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function main() {
  const findings = [];

  for (const filePath of listFiles(APP_DIR)) {
    const source = read(filePath);
    if (filePath.endsWith("/core/services/platform.service.ts")) {
      continue;
    }
    if (
      !source.includes("setLocalStorage(") &&
      !source.includes("localStorage.setItem(") &&
      !source.includes("sessionStorage.setItem(")
    ) {
      continue;
    }

    const relative = path.relative(ROOT, filePath);
    const allowed = ALLOWED_PATTERNS.find(({ pattern }) => pattern.test(relative));
    findings.push({
      file: relative,
      allowed: Boolean(allowed),
      reason: allowed?.reason || "Unexpected local persistence write",
    });
  }

  const unexpected = findings.filter((finding) => !finding.allowed);

  if (findings.length === 0) {
    logger.info("local_persistence_no_findings");
    return;
  }
  const allowedEntries = findings.filter((entry) => entry.allowed);
  if (allowedEntries.length > 0) {
    logger.info("local_persistence_allowed_entries", {
      entries: allowedEntries,
    });
  }

  if (unexpected.length > 0) {
    logger.error("local_persistence_unexpected_entries", {
      entries: unexpected,
    });
    process.exit(1);
  }

  logger.info("local_persistence_no_unexpected", {
    allowed: allowedEntries.length,
  });
}

main();
