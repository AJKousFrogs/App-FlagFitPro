#!/usr/bin/env node
/**
 * Fails the build if any template uses two-way NgModel `[(ngModel)]` on shared
 * CVA wrappers — that pattern was unsafe with WritableSignal + PrimeNG.
 *
 * Run: node scripts/check-no-bidirectional-ngmodel.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const scanDirs = [path.join(root, "src", "app", "shared", "components")];

const pattern = /\[\(\s*ngModel\s*\)\]\s*=/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith(".ts") && !name.endsWith(".spec.ts")) out.push(full);
  }
  return out;
}

let bad = [];
for (const dir of scanDirs) {
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, "utf8");
    if (pattern.test(text)) {
      bad.push(path.relative(root, file));
    }
  }
}

if (bad.length) {
  console.error(
    "[check-no-bidirectional-ngmodel] Disallowed [(ngModel)] found in shared CVA wrappers:\n",
    bad.join("\n"),
  );
  process.exit(1);
}

console.log(
  "[check-no-bidirectional-ngmodel] OK (no [(ngModel)] in shared/components)",
);
