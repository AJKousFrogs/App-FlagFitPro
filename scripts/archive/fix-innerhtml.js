#!/usr/bin/env node

/**
 * Automated script to replace simple innerHTML assignments with textContent
 * For complex HTML, manual review is still needed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "src");

// Simple patterns we can safely auto-fix
const simplePatterns = [
  // element.innerHTML = 'text' or "text" (no HTML tags)
  {
    pattern: /(\w+)\.innerHTML\s*=\s*['"]([^<>"']+)['"]/g,
    replace: (match, elem, content) => `${elem}.textContent = '${content}'`,
    description: "Simple text assignment",
  },
  // element.innerHTML = variable (where variable doesn't contain HTML)
  {
    pattern: /(\w+)\.innerHTML\s*=\s*([a-zA-Z_$][\w$]*)\s*;/g,
    replace: (match, elem, variable) => {
      // Check if the variable name suggests it contains HTML
      if (
        variable.toLowerCase().includes("html") ||
        variable.toLowerCase().includes("markup")
      ) {
        return match; // Skip, needs manual review
      }
      return `${elem}.textContent = ${variable};`;
    },
    description: "Variable assignment (non-HTML)",
  },
  // element.innerHTML = '' (clearing)
  {
    pattern: /(\w+)\.innerHTML\s*=\s*['"]['"];/g,
    replace: (match, elem) => `${elem}.textContent = '';`,
    description: "Clear element",
  },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;
    let changeCount = 0;
    const changes = [];

    // Skip files that already use setSafeContent or are test/spec files
    if (
      content.includes("setSafeContent") ||
      (content.includes("eslint-disable") &&
        content.includes("no-restricted-syntax")) ||
      filePath.includes(".test.") ||
      filePath.includes(".spec.")
    ) {
      return { modified: false, changes: 0 };
    }

    // Apply simple pattern replacements
    for (const { pattern, replace, description } of simplePatterns) {
      const originalContent = content;

      if (typeof replace === "function") {
        content = content.replace(pattern, replace);
      } else {
        content = content.replace(pattern, replace);
      }

      if (content !== originalContent) {
        const count = (originalContent.match(pattern) || []).length;
        changeCount += count;
        changes.push(`${count} × ${description}`);
        modified = true;
      }
    }

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      return { modified: true, changes: changeCount, details: changes };
    }

    return { modified: false, changes: 0 };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { modified: false, changes: 0, error: error.message };
  }
}

function findJsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".js") &&
      !entry.name.includes(".test.") &&
      !entry.name.includes(".spec.")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

console.log("🔧 Fixing simple innerHTML patterns in src/ files...\n");
console.log("Note: Complex HTML assignments still need manual review\n");

const jsFiles = findJsFiles(srcDir);
let totalModified = 0;
let totalChanges = 0;

for (const file of jsFiles) {
  const result = processFile(file);
  if (result.modified) {
    totalModified++;
    totalChanges += result.changes;
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✓ ${relativePath}`);
    if (result.details) {
      result.details.forEach((detail) => console.log(`   ${detail}`));
    }
  }
}

console.log(
  `\n✅ Auto-fixed ${totalChanges} simple innerHTML assignments in ${totalModified} files`,
);
console.log(`\n⚠️  Remaining innerHTML errors need manual review:`);
console.log(`   - innerHTML with HTML content (tags, entities)`);
console.log(`   - innerHTML with template literals`);
console.log(`   - innerHTML in complex expressions`);
console.log(`\nNext: Run 'npm run lint' to check remaining errors`);
