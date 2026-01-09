#!/usr/bin/env node
/**
 * Code Cleanup Script for FlagFit Pro
 * Removes console.log statements from production code while keeping them in:
 * - Test files
 * - Development utilities
 * - Service workers (for debugging)
 * - Server files (for logging)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files/directories to exclude from console.log removal
const EXCLUDE_PATTERNS = [
  /\.test\.(js|ts)$/,
  /\.spec\.(js|ts)$/,
  /e2e\//,
  /tests\//,
  /sw\.js$/,
  /server\.js$/,
  /server-supabase\.js$/,
  /simple-server\.js$/,
  /-server\.js$/,
  /scripts\//,
  /node_modules\//,
  /dist\//,
  /\.angular\//,
  /logger\.service\.ts$/,
  /error-tracking\.service\.ts$/,
];

// Console methods to remove (but NOT from logger services)
const CONSOLE_METHODS = ['log', 'debug', 'info'];
// Keep: console.warn, console.error (important for production debugging)

let filesModified = 0;
let statementsRemoved = 0;

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function cleanFile(filePath) {
  if (shouldExcludeFile(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let fileChanged = false;

  // Remove console.log, console.debug, console.info statements
  // But preserve the structure (replace with empty line to maintain line numbers for debugging)
  CONSOLE_METHODS.forEach(method => {
    const regex = new RegExp(`^\\s*console\\.${method}\\([^;]*\\);?\\s*$`, 'gm');
    const matches = modified.match(regex);
    
    if (matches) {
      statementsRemoved += matches.length;
      fileChanged = true;
      modified = modified.replace(regex, '');
    }
  });

  // Remove empty lines that are more than 2 consecutive
  modified = modified.replace(/\n{3,}/g, '\n\n');

  if (fileChanged) {
    fs.writeFileSync(filePath, modified, 'utf8');
    filesModified++;
    console.log(`✓ Cleaned: ${path.relative(process.cwd(), filePath)}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldExcludeFile(filePath)) {
        walkDirectory(filePath);
      }
    } else if (stat.isFile() && /\.(ts|js)$/.test(file)) {
      cleanFile(filePath);
    }
  });
}

console.log('🧹 Starting code cleanup...\n');
console.log('Removing console.log/debug/info from production code');
console.log('(Keeping console.warn and console.error)\n');

// Clean Angular application code
const angularSrcPath = path.join(__dirname, '../angular/src/app');
if (fs.existsSync(angularSrcPath)) {
  console.log('📁 Cleaning Angular application code...');
  walkDirectory(angularSrcPath);
}

console.log(`\n✅ Cleanup complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Statements removed: ${statementsRemoved}`);

if (filesModified === 0) {
  console.log('\n✨ No production console statements found - code is already clean!');
}
