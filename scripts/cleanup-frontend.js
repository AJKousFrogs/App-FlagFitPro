#!/usr/bin/env node

/**
 * Frontend Code Cleanup Script
 *
 * Cleans up:
 * - Console.log statements (production)
 * - Commented out code blocks
 * - Unused imports (basic detection)
 * - TODO/FIXME comments (optional)
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANGULAR_SRC = path.join(__dirname, "../angular/src/app");

// Configuration
const CONFIG = {
  removeConsoleLogs: true,
  removeCommentedCode: true,
  removeTODOs: false, // Keep TODOs for now
  dryRun: false, // Set to true to preview changes
};

const stats = {
  filesProcessed: 0,
  consoleLogsRemoved: 0,
  commentedBlocksRemoved: 0,
  filesModified: 0,
};

function shouldRemoveConsoleLog(line) {
  // Keep console.error and console.warn for error handling
  return (
    line.includes("console.log") ||
    line.includes("console.debug") ||
    line.includes("console.info")
  );
}

function isCommentedCodeBlock(lines, index) {
  // Detect large commented code blocks (3+ lines)
  if (index + 2 >= lines.length) {
    return false;
  }

  const current = lines[index].trim();
  const next1 = lines[index + 1]?.trim() || "";
  const next2 = lines[index + 2]?.trim() || "";

  // Check if it's a commented code block
  if (
    current.startsWith("//") &&
    next1.startsWith("//") &&
    next2.startsWith("//")
  ) {
    // Check if it looks like code (has common code patterns)
    const codePatterns = [
      /\/\/\s*(import|export|function|const|let|var|class|interface|type|if|for|while|return|=>)/,
      /\/\/\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*[=:(]/,
    ];

    return codePatterns.some(
      (pattern) =>
        pattern.test(current) || pattern.test(next1) || pattern.test(next2),
    );
  }

  return false;
}

function cleanupFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const newLines = [];
  let modified = false;
  let inCommentedBlock = false;
  let commentedBlockStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Remove console.log statements
    if (CONFIG.removeConsoleLogs && shouldRemoveConsoleLog(line)) {
      stats.consoleLogsRemoved++;
      modified = true;
      continue; // Skip this line
    }

    // Detect commented code blocks
    if (CONFIG.removeCommentedCode) {
      if (isCommentedCodeBlock(lines, i)) {
        if (!inCommentedBlock) {
          inCommentedBlock = true;
          commentedBlockStart = i;
        }
        // Skip commented code lines
        modified = true;
        stats.commentedBlocksRemoved++;
        continue;
      } else {
        if (inCommentedBlock) {
          inCommentedBlock = false;
          commentedBlockStart = -1;
        }
      }
    }

    newLines.push(line);
  }

  if (modified && !CONFIG.dryRun) {
    fs.writeFileSync(filePath, newLines.join("\n"), "utf8");
    stats.filesModified++;
  }

  if (modified) {
    stats.filesProcessed++;
  }

  return modified;
}

function cleanupDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and dist
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".git"
      ) {
        continue;
      }
      cleanupDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      cleanupFile(fullPath);
    }
  }
}

// Main execution
console.log("🧹 Starting frontend code cleanup...\n");
console.log("Configuration:");
console.log(`  - Remove console.logs: ${CONFIG.removeConsoleLogs}`);
console.log(`  - Remove commented code: ${CONFIG.removeCommentedCode}`);
console.log(`  - Dry run: ${CONFIG.dryRun}\n`);

if (CONFIG.dryRun) {
  console.log("⚠️  DRY RUN MODE - No files will be modified\n");
}

cleanupDirectory(ANGULAR_SRC);

console.log("\n✅ Cleanup complete!\n");
console.log("Statistics:");
console.log(`  - Files processed: ${stats.filesProcessed}`);
console.log(`  - Files modified: ${stats.filesModified}`);
console.log(`  - Console.logs removed: ${stats.consoleLogsRemoved}`);
console.log(`  - Commented blocks removed: ${stats.commentedBlocksRemoved}`);
