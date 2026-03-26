#!/usr/bin/env node
/**
 * Fix Hardcoded Breakpoints Script
 * =================================
 * Replaces hardcoded pixel breakpoints with design system mixins
 *
 * Replacements:
 * - @media (max-width: 768px) → @include respond-to(md)
 * - @media (max-width: 1024px) → @include respond-to(lg)
 * - @media (max-width: 640px) → @include respond-to(sm)
 * - @media (max-width: 767px) → @include respond-to(md) [just below 768]
 * - @media (max-width: 1023px) → @include respond-to(lg) [just below 1024]
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const srcPath = path.join(process.cwd(), 'angular/src');

// Find all SCSS files
const scssFiles = await glob('**/*.scss', { cwd: srcPath, absolute: true });

console.log(`\n🔍 Found ${scssFiles.length} SCSS files\n`);

let totalReplacements = 0;
const filesModified = [];

// Replacement patterns
const replacements = [
  // Max-width patterns (mobile-first)
  {
    pattern: /@media\s*\(\s*max-width:\s*768px\s*\)/gi,
    replacement: '@include respond-to(md)',
    name: '768px → respond-to(md)'
  },
  {
    pattern: /@media\s*\(\s*max-width:\s*767px\s*\)/gi,
    replacement: '@include respond-to(md)',
    name: '767px → respond-to(md)'
  },
  {
    pattern: /@media\s*\(\s*max-width:\s*1024px\s*\)/gi,
    replacement: '@include respond-to(lg)',
    name: '1024px → respond-to(lg)'
  },
  {
    pattern: /@media\s*\(\s*max-width:\s*1023px\s*\)/gi,
    replacement: '@include respond-to(lg)',
    name: '1023px → respond-to(lg)'
  },
  {
    pattern: /@media\s*\(\s*max-width:\s*640px\s*\)/gi,
    replacement: '@include respond-to(sm)',
    name: '640px → respond-to(sm)'
  },
  {
    pattern: /@media\s*\(\s*max-width:\s*639px\s*\)/gi,
    replacement: '@include respond-to(sm)',
    name: '639px → respond-to(sm)'
  },

  // Also fix min-width patterns (desktop-first)
  {
    pattern: /@media\s*\(\s*min-width:\s*769px\s*\)/gi,
    replacement: '@include respond-above(md)',
    name: '769px → respond-above(md)'
  },
  {
    pattern: /@media\s*\(\s*min-width:\s*1025px\s*\)/gi,
    replacement: '@include respond-above(lg)',
    name: '1025px → respond-above(lg)'
  },
  {
    pattern: /@media\s*\(\s*min-width:\s*641px\s*\)/gi,
    replacement: '@include respond-above(sm)',
    name: '641px → respond-above(sm)'
  }
];

for (const file of scssFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;
  let fileReplacements = 0;

  // Apply all replacement patterns
  for (const { pattern, replacement, name } of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      fileReplacements += matches.length;
      console.log(`  ✓ ${name}: ${matches.length} in ${path.relative(srcPath, file)}`);
    }
  }

  // Write back if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    filesModified.push(path.relative(srcPath, file));
    totalReplacements += fileReplacements;
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Files modified: ${filesModified.length}`);
console.log(`   Total replacements: ${totalReplacements}\n`);

if (filesModified.length > 0) {
  console.log(`Modified files:`);
  filesModified.forEach(file => console.log(`  - ${file}`));
}

process.exit(0);
