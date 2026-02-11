#!/usr/bin/env node

/**
 * Fix Trailing Newlines Script
 * Ensures all files end with a single newline
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { walkDirectory } from "./lib/directory-walker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANGULAR_SRC = path.join(__dirname, "../angular/src/app");

const stats = {
  filesProcessed: 0,
  filesFixed: 0,
};

function fixTrailingNewline(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  // Check if file ends with newline
  if (!content.endsWith("\n") && content.length > 0) {
    fs.writeFileSync(filePath, `${content}\n`, "utf8");
    stats.filesFixed++;
    return true;
  }

  // Check if file ends with multiple newlines
  const match = content.match(/\n+$/);
  if (match && match[0].length > 1) {
    const fixed = content.replace(/\n+$/, "\n");
    fs.writeFileSync(filePath, fixed, "utf8");
    stats.filesFixed++;
    return true;
  }

  return false;
}

function processFile(filePath) {
  if (fixTrailingNewline(filePath)) {
    stats.filesProcessed++;
  }
}

console.log("🔧 Fixing trailing newlines...\n");

walkDirectory(ANGULAR_SRC, processFile, {
  extensions: [".ts", ".scss", ".html"],
});

console.log("\n✅ Trailing newlines fixed!\n");
console.log("Statistics:");
console.log(`  - Files processed: ${stats.filesProcessed}`);
console.log(`  - Files fixed: ${stats.filesFixed}`);
