#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Fix Module Script Tags
 * Adds type="module" to component loader scripts across all HTML files
 *
 * This fixes the SyntaxError: Unexpected keyword 'export' errors
 * that occur when ES6 modules are loaded as regular scripts.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔧 Fixing module script tags in HTML files...\n');

// List of script patterns that need type="module"
const moduleScripts = [
  'footer-loader.js',
  'sidebar-loader.js',
  'top-bar-loader.js'
];

// Get all HTML files in root directory
const htmlFiles = readdirSync(rootDir)
  .filter(file => file.endsWith('.html'))
  .map(file => join(rootDir, file));

let filesModified = 0;
let scriptsFixed = 0;

htmlFiles.forEach(filePath => {
  const fileName = filePath.split('/').pop();
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  moduleScripts.forEach(scriptName => {
    // Pattern to match script tags without type="module"
    // Matches: <script src="./src/js/components/SCRIPTNAME" defer>
    // Or: <script src="./src/js/components/SCRIPTNAME"></script>
    const pattern = new RegExp(
      `<script\\s+src="([^"]*${scriptName})"(?!\\s+type=)([^>]*?)>`,
      'g'
    );

    const replacement = '<script type="module" src="$1"$2>';

    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      scriptsFixed++;
      console.log(`  ✅ Fixed ${scriptName} in ${fileName}`);
    }
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    filesModified++;
  }
});

console.log(`\n✨ Complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Scripts fixed: ${scriptsFixed}`);
console.log(`\n💡 All loader components now have type="module" attribute`);
