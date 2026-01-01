#!/usr/bin/env node

/**
 * Fix duplicate logger imports
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "src");

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Find all logger imports
    const importRegex =
      /import\s+\{\s*logger\s*\}\s+from\s+['"].*?logger\.js['"];?\s*\n?/g;
    const matches = content.match(importRegex);

    if (matches && matches.length > 1) {
      // Keep only the first import, remove the rest
      const firstImport = matches[0];
      content = content.replace(importRegex, "");

      // Add back the first import at the top after other imports
      const otherImports = content.match(
        /^import\s+.*?from\s+['"].*?['"];?\s*$/gm,
      );
      if (otherImports && otherImports.length > 0) {
        const lastImport = otherImports[otherImports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;
        content = `${content.slice(0, insertIndex)}\n${firstImport}${content.slice(insertIndex)}`;
      } else {
        content = firstImport + content;
      }

      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✓ Fixed ${path.relative(process.cwd(), filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findJsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

console.log("🔧 Fixing duplicate logger imports...\n");

const jsFiles = findJsFiles(srcDir);
let fixed = 0;

for (const file of jsFiles) {
  if (processFile(file)) {
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files with duplicate imports`);
