#!/usr/bin/env node
/**
 * TypeScript/TS Duplication Audit
 * Finds duplicate code, repeated patterns, and potential consolidation opportunities
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANGULAR_SRC = path.join(__dirname, "../angular/src");

function walkDir(dir, ext, files = []) {
  if (!fs.existsSync(dir)) {return files;}
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

function normalizeForCompare(s) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

function extractSignalsAndInputs(content) {
  const sig = content.match(/signal\s*<[^>]+>\s*\([^)]*\)/g) || [];
  const inp = content.match(/input\s*<[^>]+>\s*\([^)]*\)/g) || [];
  return { signals: sig.length, inputs: inp.length };
}

function findRepeatedStringLiterals(files) {
  const literalCounts = new Map();
  const literalFiles = new Map();
  const strRegex = /['"`]([^'"`]{15,80})['"`]/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(ANGULAR_SRC, file);
    let m;
    while ((m = strRegex.exec(content)) !== null) {
      const lit = m[1].replace(/\s+/g, " ").trim();
      if (lit.length > 12 && !lit.includes("${") && !lit.startsWith("http")) {
        literalCounts.set(lit, (literalCounts.get(lit) || 0) + 1);
        if (!literalFiles.has(lit)) {literalFiles.set(lit, []);}
        if (!literalFiles.get(lit).includes(rel)) {literalFiles.get(lit).push(rel);}
      }
    }
  }
  return [...literalCounts.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([lit, c]) => ({ literal: lit, count: c, files: literalFiles.get(lit) }));
}

function findSimilarFunctionBlocks(files) {
  const blocks = new Map();
  const funcRegex = /(?:private|public|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{([\s\S]{1,500}?)\n\s*\}/g;
  for (const file of files) {
    if (file.includes(".spec.") || file.includes(".test.")) {continue;}
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(ANGULAR_SRC, file);
    let m;
    while ((m = funcRegex.exec(content)) !== null) {
      const normalized = normalizeForCompare(m[2]);
      if (normalized.length > 80) {
        const key = normalized.slice(0, 120);
        if (!blocks.has(key)) {blocks.set(key, []);}
        blocks.get(key).push({ file: rel, name: m[1] });
      }
    }
  }
  return [...blocks.entries()].filter(([, arr]) => arr.length >= 2);
}

function findUnusedLikeImports(files) {
  const suspicious = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(ANGULAR_SRC, file);
    const importLines = content.match(/import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]/g) || [];
    const imports = importLines.flatMap((line) => {
      const match = line.match(/\{\s*([^}]+)\s*\}/);
      return match ? match[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim()) : [];
    });
    const used = new Set();
    for (const imp of imports) {
      const regex = new RegExp(`\\b${imp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      const matches = content.match(regex) || [];
      if (matches.length <= 1) {suspicious.push({ file: rel, import: imp });}
    }
  }
  return suspicious.slice(0, 20);
}

function main() {
  console.log("🔍 TypeScript Duplication Audit\n");
  const tsFiles = walkDir(path.join(ANGULAR_SRC, "app"), ".ts");
  console.log(`📁 Scanned ${tsFiles.length} TS files\n`);

  const repeatedLiterals = findRepeatedStringLiterals(tsFiles);
  console.log("═".repeat(60));
  console.log("1. REPEATED STRING LITERALS (3+ occurrences)\n");
  if (repeatedLiterals.length === 0) {
    console.log("   ✓ None.\n");
  } else {
    repeatedLiterals.slice(0, 15).forEach(({ literal, count, files }) => {
      const preview = literal.length > 50 ? `${literal.slice(0, 47)  }...` : literal;
      console.log(`   ${count}x  "${preview}"`);
      if (files && files.length <= 3) {files.forEach((f) => console.log(`         └ ${f}`));}
      console.log();
    });
  }

  const similarBlocks = findSimilarFunctionBlocks(tsFiles);
  console.log("═".repeat(60));
  console.log("2. POTENTIALLY DUPLICATE FUNCTION BLOCKS\n");
  if (similarBlocks.length === 0) {
    console.log("   ✓ None detected.\n");
  } else {
    similarBlocks.slice(0, 8).forEach(([key, arr]) => {
      console.log(`   Similar pattern in ${arr.length} places:`);
      arr.forEach(({ file, name }) => console.log(`      ${file} :: ${name}()`));
      console.log();
    });
  }

  const suspiciousImports = findUnusedLikeImports(tsFiles);
  console.log("═".repeat(60));
  console.log("3. POSSIBLY UNUSED IMPORTS (single occurrence)\n");
  if (suspiciousImports.length === 0) {
    console.log("   ✓ None.\n");
  } else {
    suspiciousImports.slice(0, 15).forEach(({ file, import: imp }) => {
      console.log(`   ${file}: ${imp}`);
    });
    console.log();
  }

  console.log("═".repeat(60));
  console.log("✓ TS audit complete.\n");
}

main();
