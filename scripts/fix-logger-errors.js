#!/usr/bin/env node

/**
 * Script to fix logger service type errors across the codebase
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get all TypeScript files in the angular/src directory
function getAllTsFiles(dir) {
  const files = [];

  function walk(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith(".") &&
        item !== "node_modules"
      ) {
        walk(fullPath);
      } else if (
        stat.isFile() &&
        item.endsWith(".ts") &&
        !item.endsWith(".spec.ts")
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Fix logger calls in a file
function fixLoggerCalls(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Pattern 1: Fix error() calls with unknown type - wrap in type guard
  // this.logger.error("message", error) where error is unknown
  const errorUnknownPattern =
    /(\s+)(this\.logger\.error\([^,)]+,\s*)(\w+)(\s*\))/g;
  content = content.replace(
    errorUnknownPattern,
    (match, indent, prefix, errorVar, suffix) => {
      if (
        errorVar === "err" ||
        errorVar === "error" ||
        errorVar.toLowerCase().includes("error")
      ) {
        modified = true;
        return `${indent}${prefix}${errorVar} instanceof Error ? ${errorVar} : new Error(String(${errorVar}))${suffix}`;
      }
      return match;
    },
  );

  // Pattern 2: Fix logger calls with string as LogContext (second parameter for non-error methods)
  // Replace simple strings with proper context objects
  const stringContextPatterns = [
    // this.logger.info("message", someString)
    {
      regex:
        /(this\.logger\.(info|debug|warn|success)\([^,)]+,\s*)([a-zA-Z_][a-zA-Z0-9_.]*\.(message|id|name|type|code))(\s*[,)])/g,
      replace: (match, prefix, method, prop, field, suffix) => {
        modified = true;
        return `${prefix}{ data: ${prop} }${suffix}`;
      },
    },
    // this.logger.info("message", variable)
    {
      regex:
        /(this\.logger\.(info|debug|warn|success)\("([^"]+)",\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*\))/g,
      replace: (match, prefix, method, message, varName, suffix) => {
        // Skip if it looks like it's already a context object or includes a dot
        if (
          varName.includes(".") ||
          varName === "undefined" ||
          varName === "null"
        ) {
          return match;
        }
        modified = true;
        return `${prefix}{ data: ${varName} }${suffix}`;
      },
    },
  ];

  for (const pattern of stringContextPatterns) {
    content = content.replace(pattern.regex, pattern.replace);
  }

  // Pattern 3: Fix calls with too many arguments by wrapping extras in context
  // this.logger.error("msg", error, context, extraArg) -> this.logger.error("msg", error, context)

  // Pattern 4: Fix PostgrestError being passed as LogContext
  // Convert PostgrestError to proper context
  content = content.replace(
    /(this\.logger\.(warn|error|info|debug)\([^,)]+,\s*)(\w+Error)(\s*[,)])/g,
    (match, prefix, method, errorVar, suffix) => {
      if (errorVar.includes("Error") && !match.includes("instanceof")) {
        modified = true;
        return `${prefix}{ error: ${errorVar}.message, details: ${errorVar}.details }${suffix}`;
      }
      return match;
    },
  );

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Fixed: ${filePath}`);
    return true;
  }

  return false;
}

// Main execution
const angularSrc = path.join(__dirname, "..", "angular", "src");
const files = getAllTsFiles(angularSrc);

console.log(`Found ${files.length} TypeScript files to check`);

let fixedCount = 0;
for (const file of files) {
  if (fixLoggerCalls(file)) {
    fixedCount++;
  }
}

console.log(`\nFixed ${fixedCount} files`);
console.log("\nRunning build to check for remaining errors...");

try {
  execSync("cd angular && npm run build", { stdio: "inherit" });
  console.log("\n✅ Build successful!");
} catch (error) {
  console.log("\n❌ Build still has errors. Manual fixes may be needed.");
  process.exit(1);
}
