#!/usr/bin/env node
/**
 * Revert ALL Utility Breakpoints Script
 * ======================================
 * Reverts ALL @include respond-to/respond-above back to @media queries in utility system files
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const srcPath = path.join(process.cwd(), 'angular/src');

// Files that are part of the utility/design system
const patterns = [
  'scss/utilities/**/*.scss',
  'scss/foundations/**/*.scss',
  'scss/components/primitives/**/*.scss',
  'scss/design-system/**/*.scss'
];

let filesModified = 0;

// Complete reverse replacements for all possible breakpoints
const replacements = [
  // respond-to (max-width)
  { pattern: /@include respond-to\(xs\)/gi, replacement: '@media (max-width: 640px)' },
  { pattern: /@include respond-to\(sm\)/gi, replacement: '@media (max-width: 640px)' },
  { pattern: /@include respond-to\(md\)/gi, replacement: '@media (max-width: 768px)' },
  { pattern: /@include respond-to\(lg\)/gi, replacement: '@media (max-width: 1024px)' },
  { pattern: /@include respond-to\(xl\)/gi, replacement: '@media (max-width: 1280px)' },
  { pattern: /@include respond-to\(xxl\)/gi, replacement: '@media (max-width: 1536px)' },

  // respond-above (min-width)
  { pattern: /@include respond-above\(xs\)/gi, replacement: '@media (min-width: 641px)' },
  { pattern: /@include respond-above\(sm\)/gi, replacement: '@media (min-width: 641px)' },
  { pattern: /@include respond-above\(md\)/gi, replacement: '@media (min-width: 769px)' },
  { pattern: /@include respond-above\(lg\)/gi, replacement: '@media (min-width: 1025px)' },
  { pattern: /@include respond-above\(xl\)/gi, replacement: '@media (min-width: 1281px)' },
  { pattern: /@include respond-above\(xxl\)/gi, replacement: '@media (min-width: 1537px)' }
];

for (const pattern of patterns) {
  const files = await glob(pattern, { cwd: srcPath, absolute: true });

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let originalContent = content;

    // Apply all reverse replacements
    for (const { pattern: regex, replacement } of replacements) {
      content = content.replace(regex, replacement);
    }

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      filesModified++;
      console.log(`  ✓ Reverted breakpoints in ${path.relative(srcPath, file)}`);
    }
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Files modified: ${filesModified}\n`);

process.exit(0);
