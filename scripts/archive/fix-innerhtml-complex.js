#!/usr/bin/env node

/**
 * Enhanced innerHTML fixer for complex template literals
 * Conservative approach: Only fixes cases where we can safely use setSafeContent
 * or where the HTML contains no dynamic user data
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "src");

// Patterns for innerHTML assignments with template literals (complex HTML)
// We'll add comments to guide manual review
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let changeCount = 0;

    // Check if file already imports setSafeContent
    const hasSafeContentImport = content.includes("setSafeContent");
    const hasSharedImport =
      content.includes('from "./utils/shared.js"') ||
      content.includes('from "../utils/shared.js"') ||
      content.includes('from "../../utils/shared.js"');

    // Pattern 1: Simple template literals with NO variables (static HTML only)
    // Example: element.innerHTML = `<div>Static</div>`;
    const staticHtmlRegex = /([\w.]+)\.innerHTML\s*=\s*`([^$]*?)`/g;
    const matches = [];
    let match;

    while ((match = staticHtmlRegex.exec(content)) !== null) {
      // Check if the template literal has NO ${} expressions
      if (!match[2].includes("${")) {
        matches.push({
          element: match[1],
          html: match[2],
          fullMatch: match[0],
        });
      }
    }

    if (matches.length > 0 && !hasSafeContentImport && !hasSharedImport) {
      // Need to add import first
      const fileDir = path.dirname(filePath);
      const sharedPath = path.join(srcDir, "js", "utils", "shared.js");
      const relativePath = path.relative(fileDir, sharedPath);
      const importPath = relativePath.split(path.sep).join("/");
      const importStatement = `import { setSafeContent } from '${importPath.startsWith(".") ? importPath : `./${importPath}`}';\n`;

      // Find a good place to insert the import (after other imports or at the start)
      const lastImportMatch = content.match(/import\s+.*?;/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        content = `${content.slice(0, lastImportIndex + lastImport.length)}\n${importStatement}${content.slice(lastImportIndex + lastImport.length)}`;
      } else {
        content = importStatement + content;
      }
    }

    // Now replace static innerHTML with setSafeContent calls
    for (const { element, html, fullMatch } of matches) {
      // Check if the HTML contains only safe tags and no scripts
      // eslint-disable-next-line no-script-url
      if (
        !html.includes("<script") &&
        !html.includes("javascript:") &&
        !html.includes("onerror=")
      ) {
        const replacement = `setSafeContent(${element}, \`${html}\`, true, true)`;
        content = content.replace(fullMatch, replacement);
        changeCount++;
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      return { modified: true, changes: changeCount };
    }

    return { modified: false, changes: 0 };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { modified: false, changes: 0, error: error.message };
  }
}

function findJsFiles(dir) {
  const files = [];
  try {
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
  } catch (_error) {
    // Skip directories we can't read
  }

  return files;
}

console.log("🔧 Fixing static innerHTML template literals...\\n");

const jsFiles = findJsFiles(srcDir);
let totalModified = 0;
let totalChanges = 0;

for (const file of jsFiles) {
  const result = processFile(file);
  if (result.modified) {
    totalModified++;
    totalChanges += result.changes;
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✓ ${relativePath} - ${result.changes} changes`);
  }
}

console.log(
  `\\n✅ Auto-fixed ${totalChanges} static innerHTML assignments in ${totalModified} files`,
);
console.log(
  `\\n⚠️  Remaining innerHTML with dynamic content needs manual review`,
);
console.log(`   Run 'npm run lint' to check remaining errors`);
