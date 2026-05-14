#!/usr/bin/env node
/**
 * check-mobile-first.mjs
 * ----------------------
 * Phase 1 of the mobile-first redesign installs this as a CI guardrail.
 * Locks in the current count of `@include respond-to(...)` (max-width,
 * desktop-first dialect) as a CEILING for `src/app/features/**` and
 * `src/scss/**`. New code can't make it worse; existing code is
 * grandfathered until Phase 5 converts it.
 *
 * Exit codes:
 *   0  — counts at or below ceiling, or mobile-first calls increased
 *   1  — desktop-first count increased over the ceiling
 *
 * Update the ceilings only when the count legitimately drops below them
 * (i.e. a refactor converted some calls). Never raise the ceiling for
 * new desktop-first code.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..");

// Baseline ceiling set 2026-05-14 at Phase 1 commit. Decreasing is fine.
const CEILING = {
  "src/app/features": 226,
  "src/scss": 63,
};

const DESKTOP_FIRST = /@include\s+respond-to\s*\(/g;
const MOBILE_FIRST = /@include\s+respond-(?:min|above)\s*\(/g;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path);
    else if (path.endsWith(".scss")) yield path;
  }
}

function countMatches(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

function tallyDir(absDir) {
  let desktopFirst = 0;
  let mobileFirst = 0;
  try {
    for (const file of walk(absDir)) {
      const content = readFileSync(file, "utf8");
      desktopFirst += countMatches(content, DESKTOP_FIRST);
      mobileFirst += countMatches(content, MOBILE_FIRST);
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  return { desktopFirst, mobileFirst };
}

let failed = false;
const lines = [];
for (const [dir, ceiling] of Object.entries(CEILING)) {
  const absDir = join(REPO_ROOT, dir);
  const { desktopFirst, mobileFirst } = tallyDir(absDir);
  const status = desktopFirst > ceiling ? "❌ REGRESSION" : "✓";
  lines.push(
    `${status} ${dir}: respond-to(max-width)=${desktopFirst} ceiling=${ceiling}, ` +
      `mobile-first (min/above)=${mobileFirst}`,
  );
  if (desktopFirst > ceiling) {
    failed = true;
  }
}

console.log("mobile-first redesign — respond-to() audit");
console.log("-".repeat(60));
for (const line of lines) console.log(line);
console.log("-".repeat(60));

if (failed) {
  console.error(
    "FAIL: New @include respond-to(<bp>) (max-width, desktop-first) calls " +
      "added — use mobile-first-grid() or respond-min(<bp>) instead. " +
      "See scss/utilities/_mixins.scss and the Phase 1 commits on the " +
      "mobile-first redesign branch.",
  );
  process.exit(1);
}
console.log("PASS: no new desktop-first respond-to() calls beyond ceiling.");
