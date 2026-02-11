#!/usr/bin/env node
/**
 * SCSS Duplication Audit
 * Finds duplicate rules, repeated patterns, and redundant code in SCSS files
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANGULAR_SRC = path.join(__dirname, "../angular/src");

function walkDir(dir, ext, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules") {
      walkDir(full, ext, files);
    } else if (e.isFile() && (ext ? e.name.endsWith(ext) : true)) {
      files.push(full);
    }
  }
  return files;
}

function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").replace(/\s*\{\s*/g, " { ").trim();
}

function extractRuleSignatures(content) {
  const rules = [];
  const selectorRegex = /([.#\w\[\]\/\-\s:,]+)\s*\{/g;
  let m;
  while ((m = selectorRegex.exec(content)) !== null) {
    const sel = m[1].trim().replace(/\s+/g, " ");
    if (sel && !sel.startsWith("%") && !sel.startsWith("//")) {
      rules.push(sel);
    }
  }
  return rules;
}

function findDuplicateSelectors(files) {
  const selectorCounts = new Map();
  const selectorFiles = new Map();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const selectors = extractRuleSignatures(content);
    const rel = path.relative(ANGULAR_SRC, file);
    for (const sel of selectors) {
      if (sel.length > 2) {
        selectorCounts.set(sel, (selectorCounts.get(sel) || 0) + 1);
        if (!selectorFiles.has(sel)) selectorFiles.set(sel, []);
        if (!selectorFiles.get(sel).includes(rel)) selectorFiles.get(sel).push(rel);
      }
    }
  }
  return { selectorCounts, selectorFiles };
}

function findRepeatedPatterns(files) {
  const patterns = [];
  const blockRegex = /@include\s+respond-to\s*\(\s*(\w+)\s*\)\s*\{[^}]*\}/gs;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(blockRegex) || [];
    if (matches.length > 3) {
      patterns.push({
        file: path.relative(ANGULAR_SRC, file),
        count: matches.length,
        note: "Multiple @include respond-to blocks - consider consolidating",
      });
    }
  }
  return patterns;
}

function findDuplicateValueBlocks(files) {
  const valueBlocks = new Map();
  const blockRegex = /([.#\w\s\-\[\]:,]+)\s*\{([^}]{20,200})\}/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let m;
    while ((m = blockRegex.exec(content)) !== null) {
      const sig = normalizeWhitespace(m[2]);
      if (sig.includes("var(--") || sig.includes("font-size") || sig.includes("padding")) {
        const key = `${m[1].trim()}|${sig.slice(0, 80)}`;
        if (!valueBlocks.has(key)) valueBlocks.set(key, []);
        valueBlocks.get(key).push(path.relative(ANGULAR_SRC, file));
      }
    }
  }
  const dupes = [...valueBlocks.entries()].filter(([, arr]) => arr.length > 1);
  return dupes;
}

function main() {
  console.log("🔍 SCSS Duplication Audit\n");
  const scssFiles = walkDir(path.join(ANGULAR_SRC, "app"), ".scss");
  const globalScss = walkDir(path.join(ANGULAR_SRC, "scss"), ".scss");
  const assetScss = walkDir(path.join(ANGULAR_SRC, "assets/styles"), ".scss");
  const allFiles = [...scssFiles, ...globalScss, ...assetScss];

  console.log(`📁 Scanned ${allFiles.length} SCSS files\n`);

  const { selectorCounts, selectorFiles } = findDuplicateSelectors(allFiles);
  const highDupes = [...selectorCounts.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

  console.log("═".repeat(60));
  console.log("1. DUPLICATE SELECTORS (3+ occurrences)\n");
  if (highDupes.length === 0) {
    console.log("   ✓ No highly duplicated selectors found.\n");
  } else {
    highDupes.forEach(([sel, count]) => {
      const files = selectorFiles.get(sel);
      const preview = sel.length > 60 ? sel.slice(0, 57) + "..." : sel;
      console.log(`   ${count}x  ${preview}`);
      if (files && files.length <= 5) {
        files.forEach((f) => console.log(`         └ ${f}`));
      } else if (files) {
        console.log(`         └ ${files.length} files`);
      }
      console.log();
    });
  }

  const repeatedPatterns = findRepeatedPatterns(allFiles);
  console.log("═".repeat(60));
  console.log("2. FILES WITH MANY respond-to BLOCKS (4+)\n");
  if (repeatedPatterns.length === 0) {
    console.log("   ✓ None.\n");
  } else {
    repeatedPatterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .forEach((p) => console.log(`   ${p.count}x  ${p.file} - ${p.note}`));
    console.log();
  }

  const valueDupes = findDuplicateValueBlocks(allFiles);
  console.log("═".repeat(60));
  console.log("3. POTENTIAL DUPLICATE RULE BLOCKS\n");
  if (valueDupes.length === 0) {
    console.log("   ✓ None detected.\n");
  } else {
    valueDupes.slice(0, 10).forEach(([key, files]) => {
      const [selector] = key.split("|");
      console.log(`   Selector: ${selector.slice(0, 50)}...`);
      console.log(`   Files: ${files.join(", ")}\n`);
    });
  }

  console.log("═".repeat(60));
  console.log("✓ SCSS audit complete.\n");
}

main();
