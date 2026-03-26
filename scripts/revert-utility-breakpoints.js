#!/usr/bin/env node
/**
 * Revert Utility Breakpoints Script
 * ==================================
 * Reverts @include respond-to back to @media queries in utility system files
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

// Reverse replacements
const replacements = [
  {
    pattern: /@include respond-to\(md\)/gi,
    replacement: '@media (max-width: 768px)',
    name: 'respond-to(md) → 768px'
  },
  {
    pattern: /@include respond-to\(lg\)/gi,
    replacement: '@media (max-width: 1024px)',
    name: 'respond-to(lg) → 1024px'
  },
  {
    pattern: /@include respond-to\(sm\)/gi,
    replacement: '@media (max-width: 640px)',
    name: 'respond-to(sm) → 640px'
  },
  {
    pattern: /@include respond-above\(md\)/gi,
    replacement: '@media (min-width: 769px)',
    name: 'respond-above(md) → 769px'
  },
  {
    pattern: /@include respond-above\(lg\)/gi,
    replacement: '@media (min-width: 1025px)',
    name: 'respond-above(lg) → 1025px'
  },
  {
    pattern: /@include respond-above\(sm\)/gi,
    replacement: '@media (min-width: 641px)',
    name: 'respond-above(sm) → 641px'
  }
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
