#!/usr/bin/env node
/**
 * JavaScript Duplication Audit
 * Finds duplicate code, repeated patterns in scripts/ and netlify/functions/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function walkDir(dir, ext, files = [], opts = {}) {
  if (!fs.existsSync(dir)) {return files;}
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith(".") || e.name === "node_modules") {continue;}
      if (opts.skipDirs && opts.skipDirs.includes(e.name)) {continue;}
      walkDir(full, ext, files, opts);
    } else if (e.isFile()) {
      const match = Array.isArray(ext)
        ? ext.some((e2) => e.name.endsWith(e2))
        : e.name.endsWith(ext);
      if (match) {files.push(full);}
    }
  }
  return files;
}

function collectJsFiles() {
  const scriptFiles = walkDir(path.join(ROOT, "scripts"), [".js", ".mjs"], [], {
    skipDirs: ["archive", "lib"],
  }).filter((f) => !f.includes("audit-"));
  const netlifyFiles = walkDir(path.join(ROOT, "netlify/functions"), ".js");
  return [...scriptFiles, ...netlifyFiles];
}

function relPath(f) {
  return path.relative(ROOT, f);
}

function normalizeForCompare(s) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

function findRepeatedStringLiterals(files) {
  const literalCounts = new Map();
  const literalFiles = new Map();
  const strRegex = /['"`]([^'"`]{15,80})['"`]/g;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const rel = relPath(file);
    let m;
    while ((m = strRegex.exec(content)) !== null) {
      const lit = m[1].replace(/\s+/g, " ").trim();
      if (lit.length > 12 && !lit.includes("${") && !lit.startsWith("http")) {
        literalCounts.set(lit, (literalCounts.get(lit) || 0) + 1);
        if (!literalFiles.has(lit)) {literalFiles.set(lit, []);}
        const arr = literalFiles.get(lit);
        if (!arr.includes(rel)) {arr.push(rel);}
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
  const funcRegex = /(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*\{([\s\S]{1,500}?)\n\s*\}/g;
  for (const file of files) {
    if (file.includes(".spec.") || file.includes(".test.")) {continue;}
    const content = fs.readFileSync(file, "utf8");
    const rel = relPath(file);
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

function findRepeatedRequireImport(files) {
  const reqs = new Map();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const rel = relPath(file);
    const imports = content.match(/(?:const|let|var)\s+\{[^}]+\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    const esImports = content.match(/import\s+(?:\{[^}]+\}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g) || [];
    for (const line of imports) {
      const m = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (m) {
        const pkg = m[1];
        if (!reqs.has(pkg)) {reqs.set(pkg, []);}
        if (!reqs.get(pkg).includes(rel)) {reqs.get(pkg).push(rel);}
      }
    }
    for (const line of esImports) {
      const m = line.match(/from\s+['"]([^'"]+)['"]/);
      if (m) {
        const pkg = m[1];
        if (!reqs.has(pkg)) {reqs.set(pkg, []);}
        if (!reqs.get(pkg).includes(rel)) {reqs.get(pkg).push(rel);}
      }
    }
  }
  return [...reqs.entries()].filter(([, arr]) => arr.length >= 5).sort((a, b) => b[1].length - a[1].length);
}

function main() {
  console.log("🔍 JavaScript Duplication Audit\n");
  const files = collectJsFiles();
  console.log(`📁 Scanned ${files.length} JS files (scripts/ + netlify/functions/)\n`);

  const repeatedLiterals = findRepeatedStringLiterals(files);
  console.log("═".repeat(60));
  console.log("1. REPEATED STRING LITERALS (3+ occurrences)\n");
  if (repeatedLiterals.length === 0) {
    console.log("   ✓ None.\n");
  } else {
    repeatedLiterals.slice(0, 15).forEach(({ literal, count, files: fs }) => {
      const preview = literal.length > 50 ? `${literal.slice(0, 47)  }...` : literal;
      console.log(`   ${count}x  "${preview}"`);
      if (fs && fs.length <= 4) {fs.forEach((f) => console.log(`         └ ${f}`));}
      console.log();
    });
  }

  const similarBlocks = findSimilarFunctionBlocks(files);
  console.log("═".repeat(60));
  console.log("2. POTENTIALLY DUPLICATE FUNCTION BLOCKS\n");
  if (similarBlocks.length === 0) {
    console.log("   ✓ None detected.\n");
  } else {
    similarBlocks.slice(0, 10).forEach(([key, arr]) => {
      console.log(`   Similar pattern in ${arr.length} places:`);
      arr.forEach(({ file, name }) => console.log(`      ${file} :: ${name}()`));
      console.log();
    });
  }

  const repeatedImports = findRepeatedRequireImport(files);
  console.log("═".repeat(60));
  console.log("3. MOST USED IMPORTS (5+ files)\n");
  if (repeatedImports.length === 0) {
    console.log("   ✓ None.\n");
  } else {
    repeatedImports.slice(0, 10).forEach(([pkg, arr]) => {
      console.log(`   ${arr.length}x  ${pkg}`);
      if (arr.length <= 5) {arr.forEach((f) => console.log(`         └ ${f}`));}
      console.log();
    });
  }

  console.log("═".repeat(60));
  console.log("✓ JS audit complete.\n");
}

main();
