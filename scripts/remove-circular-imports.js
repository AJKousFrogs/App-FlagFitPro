#!/usr/bin/env node
/**
 * Remove Circular Imports Script
 * ===============================
 * Removes @use "styles/mixins" from files that are themselves part of the mixins system
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const srcPath = path.join(process.cwd(), 'angular/src');

// Files that are part of the mixins system and shouldn't import mixins
const patterns = [
  'scss/utilities/**/*.scss',
  'scss/foundations/**/*.scss',
  'scss/components/primitives/**/*.scss',
  'scss/design-system/**/*.scss',
  'assets/styles/overrides/**/*.scss'
];

let filesModified = 0;

for (const pattern of patterns) {
  const files = await glob(pattern, { cwd: srcPath, absolute: true });

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    // Check if file has the mixin import at the start
    const hasImportAtStart = /^@use "styles\/mixins" as \*;\s*\n/.test(content);

    if (hasImportAtStart) {
      // Remove the import line
      content = content.replace(/^@use "styles\/mixins" as \*;\s*\n\n?/, '');

      fs.writeFileSync(file, content, 'utf-8');
      filesModified++;
      console.log(`  ✓ Removed mixin import from ${path.relative(srcPath, file)}`);
    }
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Files modified: ${filesModified}\n`);

process.exit(0);
