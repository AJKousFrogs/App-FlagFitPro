#!/usr/bin/env node
/**
 * Add Mixin Imports Script
 * =========================
 * Adds @use "styles/mixins" as *; to files that use respond-to mixin but don't have the import
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const srcPath = path.join(process.cwd(), 'angular/src');

// Find all SCSS files
const scssFiles = await glob('**/*.scss', { cwd: srcPath, absolute: true, ignore: ['**/styles.scss', '**/mixins.scss', '**/utilities/_mixins.scss'] });

console.log(`\n🔍 Found ${scssFiles.length} SCSS files\n`);

let filesModified = 0;

for (const file of scssFiles) {
  let content = fs.readFileSync(file, 'utf-8');

  // Check if file uses respond-to mixin
  const usesRespondTo = content.includes('@include respond-to') || content.includes('@include respond-above');

  // Check if file already has the mixin import
  const hasImport = content.includes('@use "styles/mixins"') || content.includes("@use 'styles/mixins'");

  if (usesRespondTo && !hasImport) {
    // Add the import at the top
    const importStatement = '@use "styles/mixins" as *;\n\n';

    // Remove any existing empty lines at the start
    content = content.replace(/^\s+/, '');

    // Add import
    content = importStatement + content;

    fs.writeFileSync(file, content, 'utf-8');
    filesModified++;
    console.log(`  ✓ Added mixin import to ${path.relative(srcPath, file)}`);
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Files modified: ${filesModified}\n`);

process.exit(0);
