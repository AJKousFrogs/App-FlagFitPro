#!/usr/bin/env node

/**
 * Fix Trailing Newlines Script
 * Ensures all files end with a single newline
 */

const fs = require("fs");
const path = require("path");

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

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".git"
      ) {
        continue;
      }
      processDirectory(fullPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") ||
        entry.name.endsWith(".scss") ||
        entry.name.endsWith(".html"))
    ) {
      if (fixTrailingNewline(fullPath)) {
        stats.filesProcessed++;
      }
    }
  }
}

console.log("🔧 Fixing trailing newlines...\n");

processDirectory(ANGULAR_SRC);

console.log("\n✅ Trailing newlines fixed!\n");
console.log("Statistics:");
console.log(`  - Files processed: ${stats.filesProcessed}`);
console.log(`  - Files fixed: ${stats.filesFixed}`);
