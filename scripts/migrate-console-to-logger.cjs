#!/usr/bin/env node

/**
 * Console.log to Logger Migration Script
 * 
 * This script helps identify and migrate console.log, console.error, and console.warn
 * usage to the centralized logger service.
 * 
 * Usage:
 *   node scripts/migrate-console-to-logger.js [--dry-run] [--fix] [path]
 * 
 * Options:
 *   --dry-run  Show what would be changed without making changes (default)
 *   --fix      Actually make the changes
 *   path       Specific file or directory to process (default: src/)
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  // Directories to process
  defaultPaths: ["src/"],
  
  // Directories to skip
  skipDirs: [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    "angular", // Angular has its own logging service
  ],
  
  // File extensions to process
  extensions: [".js", ".mjs"],
  
  // Files that are allowed to use console (scripts, tests, etc.)
  allowedFiles: [
    "scripts/",
    "tests/",
    "*.test.js",
    "*.spec.js",
    "server.js",
    "simple-server.js",
    "logger.js", // The logger itself is allowed to use console
  ],
  
  // Mapping of console methods to logger methods
  methodMapping: {
    "console.log": "logger.debug",
    "console.info": "logger.info",
    "console.warn": "logger.warn",
    "console.error": "logger.error",
    "console.debug": "logger.debug",
  },
  
  // Logger import statement
  loggerImport: 'import { logger } from "./logger.js";',
};

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes("--fix");
const targetPath = args.find((arg) => !arg.startsWith("--")) || "src/";

console.log(`
╔════════════════════════════════════════════════════════════╗
║       Console to Logger Migration Script                    ║
╠════════════════════════════════════════════════════════════╣
║  Mode: ${dryRun ? "DRY RUN (no changes)" : "FIX (making changes)"}                              ║
║  Path: ${targetPath.padEnd(51)}║
╚════════════════════════════════════════════════════════════╝
`);

// Statistics
const stats = {
  filesScanned: 0,
  filesWithConsole: 0,
  filesFixed: 0,
  totalReplacements: 0,
  byMethod: {
    "console.log": 0,
    "console.info": 0,
    "console.warn": 0,
    "console.error": 0,
    "console.debug": 0,
  },
  skippedFiles: [],
  errors: [],
};

/**
 * Check if a file should be skipped
 */
function shouldSkipFile(filePath) {
  // Check if in skip directory
  for (const skipDir of CONFIG.skipDirs) {
    if (filePath.includes(path.sep + skipDir + path.sep) || filePath.includes("/" + skipDir + "/")) {
      return true;
    }
  }
  
  // Check if in allowed files list
  for (const allowed of CONFIG.allowedFiles) {
    if (allowed.startsWith("*")) {
      if (filePath.endsWith(allowed.slice(1))) {
        return true;
      }
    } else if (filePath.includes(allowed)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the correct logger import path relative to the file
 */
function getLoggerImport(filePath) {
  const fileDir = path.dirname(filePath);
  const loggerPath = path.resolve("src/logger.js");
  
  let relativePath = path.relative(fileDir, loggerPath);
  
  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }
  
  // Convert backslashes to forward slashes for imports
  relativePath = relativePath.replace(/\\/g, "/");
  
  return `import { logger } from "${relativePath}";`;
}

/**
 * Check if file already imports logger
 */
function hasLoggerImport(content) {
  return /import\s+.*logger.*from\s+['"]/i.test(content) ||
         /const\s+.*logger.*=\s+require\(/i.test(content);
}

/**
 * Process a single file
 */
function processFile(filePath) {
  stats.filesScanned++;
  
  if (shouldSkipFile(filePath)) {
    stats.skippedFiles.push(filePath);
    return;
  }
  
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    return;
  }
  
  // Find console usage
  const consoleRegex = /console\.(log|info|warn|error|debug)\s*\(/g;
  const matches = content.match(consoleRegex);
  
  if (!matches || matches.length === 0) {
    return;
  }
  
  stats.filesWithConsole++;
  
  console.log(`\n📁 ${filePath}`);
  
  let newContent = content;
  let replacements = 0;
  
  // Count by method
  for (const match of matches) {
    const method = match.replace(/\s*\($/, "");
    if (stats.byMethod[method] !== undefined) {
      stats.byMethod[method]++;
    }
  }
  
  // Replace console methods with logger methods
  for (const [consoleMethod, loggerMethod] of Object.entries(CONFIG.methodMapping)) {
    const regex = new RegExp(consoleMethod.replace(".", "\\.") + "\\s*\\(", "g");
    const methodMatches = newContent.match(regex);
    
    if (methodMatches) {
      console.log(`   ${consoleMethod} → ${loggerMethod} (${methodMatches.length} occurrences)`);
      newContent = newContent.replace(regex, loggerMethod + "(");
      replacements += methodMatches.length;
    }
  }
  
  // Add logger import if needed and not already present
  if (replacements > 0 && !hasLoggerImport(content)) {
    const loggerImport = getLoggerImport(filePath);
    
    // Find the best place to add the import
    // After other imports or at the beginning
    const importRegex = /^(import\s+.*;\s*\n)+/m;
    const importMatch = newContent.match(importRegex);
    
    if (importMatch) {
      // Add after existing imports
      newContent = newContent.replace(importMatch[0], importMatch[0] + loggerImport + "\n");
    } else {
      // Add at the beginning (after any comments/shebang)
      const firstLineRegex = /^(#!.*\n|\/\*[\s\S]*?\*\/\s*\n|\/\/.*\n)*/;
      const firstLineMatch = newContent.match(firstLineRegex);
      const prefix = firstLineMatch ? firstLineMatch[0] : "";
      const rest = firstLineMatch ? newContent.slice(firstLineMatch[0].length) : newContent;
      newContent = prefix + loggerImport + "\n\n" + rest;
    }
    
    console.log(`   ➕ Added logger import`);
  }
  
  stats.totalReplacements += replacements;
  
  // Write changes if not dry run
  if (!dryRun && replacements > 0) {
    try {
      fs.writeFileSync(filePath, newContent, "utf8");
      stats.filesFixed++;
      console.log(`   ✅ Fixed ${replacements} occurrences`);
    } catch (error) {
      stats.errors.push({ file: filePath, error: error.message });
      console.log(`   ❌ Error writing file: ${error.message}`);
    }
  } else if (dryRun && replacements > 0) {
    console.log(`   📝 Would fix ${replacements} occurrences`);
  }
}

/**
 * Walk directory recursively
 */
function walkDirectory(dirPath) {
  let files;
  try {
    files = fs.readdirSync(dirPath);
  } catch (error) {
    stats.errors.push({ file: dirPath, error: error.message });
    return;
  }
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    let stat;
    
    try {
      stat = fs.statSync(filePath);
    } catch (error) {
      continue;
    }
    
    if (stat.isDirectory()) {
      // Check if should skip directory
      if (!CONFIG.skipDirs.includes(file)) {
        walkDirectory(filePath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (CONFIG.extensions.includes(ext)) {
        processFile(filePath);
      }
    }
  }
}

// Main execution
const fullPath = path.resolve(targetPath);

if (fs.existsSync(fullPath)) {
  const stat = fs.statSync(fullPath);
  
  if (stat.isDirectory()) {
    walkDirectory(fullPath);
  } else if (stat.isFile()) {
    processFile(fullPath);
  }
} else {
  console.error(`Error: Path not found: ${fullPath}`);
  process.exit(1);
}

// Print summary
console.log(`
╔════════════════════════════════════════════════════════════╗
║                       Summary                               ║
╠════════════════════════════════════════════════════════════╣
║  Files scanned:        ${String(stats.filesScanned).padStart(5)}                             ║
║  Files with console:   ${String(stats.filesWithConsole).padStart(5)}                             ║
║  Files fixed:          ${String(stats.filesFixed).padStart(5)}                             ║
║  Total replacements:   ${String(stats.totalReplacements).padStart(5)}                             ║
╠════════════════════════════════════════════════════════════╣
║  By method:                                                 ║
║    console.log:        ${String(stats.byMethod["console.log"]).padStart(5)}                             ║
║    console.info:       ${String(stats.byMethod["console.info"]).padStart(5)}                             ║
║    console.warn:       ${String(stats.byMethod["console.warn"]).padStart(5)}                             ║
║    console.error:      ${String(stats.byMethod["console.error"]).padStart(5)}                             ║
║    console.debug:      ${String(stats.byMethod["console.debug"]).padStart(5)}                             ║
╚════════════════════════════════════════════════════════════╝
`);

if (stats.skippedFiles.length > 0 && stats.skippedFiles.length <= 10) {
  console.log("Skipped files (allowed to use console):");
  stats.skippedFiles.forEach((f) => console.log(`  - ${f}`));
} else if (stats.skippedFiles.length > 10) {
  console.log(`Skipped ${stats.skippedFiles.length} files (allowed to use console)`);
}

if (stats.errors.length > 0) {
  console.log("\nErrors:");
  stats.errors.forEach((e) => console.log(`  - ${e.file}: ${e.error}`));
}

if (dryRun && stats.totalReplacements > 0) {
  console.log(`
⚠️  This was a dry run. No files were modified.
    Run with --fix to apply changes:
    
    node scripts/migrate-console-to-logger.js --fix ${targetPath}
`);
}

process.exit(stats.errors.length > 0 ? 1 : 0);
