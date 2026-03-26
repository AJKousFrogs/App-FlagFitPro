#!/usr/bin/env node
/**
 * Add 100dvh Fallbacks Script
 * ============================
 * Adds keyboard-aware viewport height (100dvh) fallback after 100vh declarations
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const srcPath = path.join(process.cwd(), 'angular/src');

// Find all SCSS files
const scssFiles = await glob('**/*.scss', { cwd: srcPath, absolute: true });

console.log(`\n🔍 Found ${scssFiles.length} SCSS files\n`);

let totalChanges = 0;
const filesModified = [];

for (const file of scssFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;
  let fileChanges = 0;

  // Pattern: Find "height: 100vh" or "min-height: 100vh" without dvh fallback on next line
  // Match patterns like:
  //   height: 100vh;
  //   min-height: 100vh;
  //   max-height: 100vh;

  const patterns = [
    {
      // height: 100vh; (not already followed by dvh)
      search: /([ \t]*)(height:\s*100vh;)(?!\s*\n\s*height:\s*100dvh)/gm,
      replace: '$1$2\n$1height: 100dvh; // Modern: keyboard-aware'
    },
    {
      // min-height: 100vh; (not already followed by dvh)
      search: /([ \t]*)(min-height:\s*100vh;)(?!\s*\n\s*min-height:\s*100dvh)/gm,
      replace: '$1$2\n$1min-height: 100dvh; // Modern: keyboard-aware'
    },
    {
      // height: calc(100vh - ...) patterns
      search: /([ \t]*)(height:\s*calc\(100vh\s*[-+][^;]+\);)(?!\s*\n\s*height:\s*calc\(100dvh)/gm,
      replace: (match, indent, declaration) => {
        const dvhDeclaration = declaration.replace(/100vh/g, '100dvh');
        return `${indent}${declaration}\n${indent}${dvhDeclaration} // Modern: keyboard-aware`;
      }
    },
    {
      // min-height: calc(100vh - ...) patterns
      search: /([ \t]*)(min-height:\s*calc\(100vh\s*[-+][^;]+\);)(?!\s*\n\s*min-height:\s*calc\(100dvh)/gm,
      replace: (match, indent, declaration) => {
        const dvhDeclaration = declaration.replace(/100vh/g, '100dvh');
        return `${indent}${declaration}\n${indent}${dvhDeclaration} // Modern: keyboard-aware`;
      }
    }
  ];

  for (const { search, replace } of patterns) {
    const newContent = content.replace(search, replace);
    if (newContent !== content) {
      const matches = (content.match(search) || []).length;
      fileChanges += matches;
      content = newContent;
    }
  }

  // Write back if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    filesModified.push(path.relative(srcPath, file));
    totalChanges += fileChanges;
    console.log(`  ✓ Added ${fileChanges} dvh fallback(s) to ${path.relative(srcPath, file)}`);
  }
}

console.log(`\n✅ Complete!`);
console.log(`   Files modified: ${filesModified.length}`);
console.log(`   Total fallbacks added: ${totalChanges}\n`);

if (filesModified.length > 0) {
  console.log(`Modified files:`);
  filesModified.forEach(file => console.log(`  - ${file}`));
}

process.exit(0);
