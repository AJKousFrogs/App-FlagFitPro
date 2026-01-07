#!/usr/bin/env node

/**
 * Automated script to replace console.log/error/warn with logger calls in src/ files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');

// Patterns to replace
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    description: 'console.log → logger.info'
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    description: 'console.error → logger.error'
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    description: 'console.warn → logger.warn'
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    description: 'console.debug → logger.debug'
  }
];

// Check if file needs logger import
function needsLoggerImport(content) {
  return content.includes('logger.') && !content.includes("from '../logger.js'") && !content.includes("from '../../logger.js'") && !content.includes("from '../../../logger.js'");
}

// Add logger import to file
function addLoggerImport(content, filePath) {
  // Calculate relative path to logger.js from current file
  const fileDir = path.dirname(filePath);
  const loggerPath = path.join(srcDir, 'logger.js');
  const relativePath = path.relative(fileDir, loggerPath);

  // Normalize path separators for import
  const importPath = relativePath.split(path.sep).join('/');

  // Add import at the top after any existing imports
  const importStatement = `import { logger } from '${importPath.startsWith('.') ? importPath : './' + importPath}';\n`;

  // Find the last import statement
  const importRegex = /^import\s+.*?from\s+['"].*?['"];?\s*$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    // Add after last import
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;
    return content.slice(0, insertIndex) + '\n' + importStatement + content.slice(insertIndex);
  } else {
    // Add at the beginning
    return importStatement + '\n' + content;
  }
}

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changeCount = 0;

    // Skip if file already has eslint-disable for no-console
    if (content.includes('eslint-disable') && content.includes('no-console')) {
      return { modified: false, changes: 0 };
    }

    // Apply replacements
    for (const { pattern, replacement, description: _description } of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changeCount += matches.length;
        modified = true;
      }
    }

    // Add logger import if needed
    if (modified && needsLoggerImport(content)) {
      content = addLoggerImport(content, filePath);
    }

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { modified: true, changes: changeCount };
    }

    return { modified: false, changes: 0 };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { modified: false, changes: 0, error: error.message };
  }
}

// Recursively find all .js files in src/
function findJsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
console.log('🔧 Fixing console statements in src/ files...\n');

const jsFiles = findJsFiles(srcDir);
let totalModified = 0;
let totalChanges = 0;

for (const file of jsFiles) {
  const result = processFile(file);
  if (result.modified) {
    totalModified++;
    totalChanges += result.changes;
    const relativePath = path.relative(process.cwd(), file);
    console.log(`✓ ${relativePath} (${result.changes} changes)`);
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Modified: ${totalModified} files`);
console.log(`   Total changes: ${totalChanges} console statements`);
console.log(`\nNext: Run 'npm run lint' to check remaining errors`);
