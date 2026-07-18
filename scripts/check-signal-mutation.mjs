#!/usr/bin/env node
/**
 * Signal-value Mutation Checker
 *
 * POLICY: never mutate the value held by a signal in place.
 *
 * Every one of this app's components runs `ChangeDetectionStrategy.OnPush`
 * under `provideZonelessChangeDetection()`. In that setup a signal notifies its
 * consumers when its REFERENCE changes. Mutating the held array/object/Set in
 * place changes no reference, so nothing re-renders — the data is right and the
 * screen is wrong, with no error anywhere. On a load-management screen that is
 * an athlete reading a stale prescription.
 *
 * The whole codebase was audited clean on 2026-07-18 (0 violations across 71
 * components / 42 services). This script exists so it STAYS clean — the failure
 * mode is silent, so a human reviewer will not reliably catch a regression.
 *
 * Correct:   this.items.update((v) => [...v, x]);
 *            this.chosen.update((s) => new Set(s).add(x));
 * Violation: this.items().push(x);
 *            const arr = this.items(); arr.push(x);
 *
 * Usage:
 *   node scripts/check-signal-mutation.mjs          # report + fail on hits
 *   node scripts/check-signal-mutation.mjs --self-test
 *       Runs the detector against planted positives and negatives. A checker
 *       that reports "clean" is worthless until it is shown to detect a
 *       positive, so CI runs this first.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "angular", "src", "app");

/** Array methods that mutate the receiver. */
const MUTATORS = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
];

/** Set/Map methods that mutate the receiver. */
const SET_MUTATORS = ["add", "delete", "clear"];

const MUT_GROUP = [...MUTATORS, ...SET_MUTATORS].join("|");

// Direct: someSignal().push(...)  /  someSignal().foo = x
const DIRECT_CALL = new RegExp(`\\w+\\(\\)\\.(${MUT_GROUP})\\(`);
const DIRECT_ASSIGN = /\w+\(\)\.[a-zA-Z_]\w*\s*=\s*[^=]/;

// Indirect: const x = someSignal();  … later …  x.push(...) / x.foo = y
const BIND = /^\s*(?:const|let)\s+(\w+)\s*=\s*(?:this\.)?[\w.]+\(\)\s*;?\s*$/;
const LOOKAHEAD = 10;

/**
 * A bare `.sort()` on a fresh array from filter/map/slice/spread is fine — the
 * receiver is already a copy. Only flag when the chain starts at a call result
 * with no copying step in between.
 */
const COPYING =
  /(\[\s*\.\.\.|\.filter\(|\.map\(|\.slice\(|Array\.from\(|new (Set|Map)\()/;

function scanSource(source, file) {
  const lines = source.split("\n");
  const violations = [];

  lines.forEach((line, i) => {
    const stripped = line.replace(/\/\/.*$/, "");

    if (DIRECT_CALL.test(stripped) && !COPYING.test(stripped)) {
      violations.push({ file, line: i + 1, code: line.trim(), kind: "direct" });
      return;
    }
    if (DIRECT_ASSIGN.test(stripped) && !COPYING.test(stripped)) {
      violations.push({ file, line: i + 1, code: line.trim(), kind: "direct" });
      return;
    }

    const bind = BIND.exec(stripped);
    if (!bind) return;
    const varName = bind[1];
    const callMut = new RegExp(`\\b${varName}\\.(${MUT_GROUP})\\(`);
    const assignMut = new RegExp(`\\b${varName}\\.[a-zA-Z_]\\w*\\s*=\\s*[^=]`);

    for (let j = i + 1; j < Math.min(i + 1 + LOOKAHEAD, lines.length); j++) {
      const next = lines[j].replace(/\/\/.*$/, "");
      // Reassigned or copied away — no longer the signal's own object.
      if (new RegExp(`\\b${varName}\\s*=[^=]`).test(next)) break;
      if (callMut.test(next) || assignMut.test(next)) {
        violations.push({
          file,
          line: j + 1,
          code: `${bind[0].trim()} → ${lines[j].trim()}`,
          kind: "indirect",
        });
        break;
      }
    }
  });

  return violations;
}

function collectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.name.endsWith(".ts") && !entry.name.includes(".spec."))
      out.push(full);
  }
  return out;
}

function selfTest() {
  const POSITIVES = [
    ["direct push", `this.items().push("x");`],
    ["direct assign", `this.config().enabled = true;`],
    ["set add", `this.chosen().add("x");`],
    ["indirect push", `    const arr = this.items();\n    arr.push("x");`],
    [
      "indirect assign after a gap",
      `    const cfg = this.config();\n    const n = 1;\n    cfg.enabled = true;`,
    ],
  ];
  const NEGATIVES = [
    ["spread copy", `this.items.update((v) => [...v, "x"]);`],
    ["new Set copy", `this.chosen.update((s) => new Set(s).add("x"));`],
    ["sort on a filtered copy", `const a = xs.filter(Boolean).sort();`],
    ["sort on a spread copy", `[...this.games()].sort((a, b) => a - b);`],
    [
      "rebound before mutating",
      `    const arr = this.items();\n    arr = [...arr, "x"];`,
    ],
  ];

  let failures = 0;
  for (const [name, code] of POSITIVES) {
    if (scanSource(code, "self-test").length === 0) {
      console.error(`  ✘ self-test MISS (should have flagged): ${name}`);
      failures++;
    }
  }
  for (const [name, code] of NEGATIVES) {
    if (scanSource(code, "self-test").length > 0) {
      console.error(`  ✘ self-test FALSE POSITIVE: ${name}`);
      failures++;
    }
  }
  if (failures > 0) {
    console.error(
      `\n✘ Detector self-test failed (${failures}). The checker is broken — a "clean" result from it would be meaningless.`,
    );
    return 1;
  }
  console.log(
    `✓ Detector self-test passed (${POSITIVES.length} positives, ${NEGATIVES.length} negatives).`,
  );
  return 0;
}

function main() {
  if (process.argv.includes("--self-test")) process.exit(selfTest());

  // Always self-test first — see the note in the usage block.
  if (selfTest() !== 0) process.exit(1);

  const files = collectFiles(ROOT);
  const violations = files.flatMap((f) =>
    scanSource(fs.readFileSync(f, "utf8"), path.relative(ROOT, f)),
  );

  if (violations.length === 0) {
    console.log(
      `✓ No in-place signal-value mutation found (${files.length} files).`,
    );
    process.exit(0);
  }

  console.error(`\n✘ In-place signal-value mutation (${violations.length}):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.kind}]`);
    console.error(`    ${v.code}`);
  }
  console.error(
    `\nUnder OnPush + zoneless, mutating a signal's value in place updates no\nreference, so nothing re-renders. Replace the value instead:\n  this.items.update((v) => [...v, x]);\n  this.chosen.update((s) => new Set(s).add(x));\n`,
  );
  process.exit(1);
}

main();
