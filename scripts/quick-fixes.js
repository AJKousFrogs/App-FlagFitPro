#!/usr/bin/env node

/**
 * Quick Fixes Script
 * 
 * Applies critical fixes to make the app work immediately.
 * Run this FIRST before doing anything else.
 * 
 * Usage:
 *   node scripts/quick-fixes.js
 *   node scripts/quick-fixes.js --apply
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CRITICAL_FIXES = [
  {
    name: 'Force white text on green buttons',
    file: 'angular/src/styles.scss',
    find: /(@layer overrides\s*\{)/,
    replace: `$1\n  /* CRITICAL FIX: Force white text on green buttons */\n  .p-button:not(.p-button-outlined):not(.p-button-text) {\n    color: #ffffff !important;\n    * {\n      color: #ffffff !important;\n    }\n  }\n  \n  .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary) {\n    background: #089949 !important;\n  }`,
    append: true,
  },
  {
    name: 'Fix card padding consistency',
    file: 'angular/src/styles.scss',
    find: /(@layer overrides\s*\{)/,
    replace: `$1\n  /* CRITICAL FIX: Consistent card padding */\n  .p-card .p-card-body {\n    padding: 16px !important;\n    gap: 12px !important;\n  }`,
    append: true,
  },
  {
    name: 'Fix input consistency',
    file: 'angular/src/styles.scss',
    find: /(@layer overrides\s*\{)/,
    replace: `$1\n  /* CRITICAL FIX: Consistent inputs */\n  .p-inputtext,\n  .p-select {\n    border-radius: 12px !important;\n    min-height: 44px !important;\n    padding: 12px 16px !important;\n  }`,
    append: true,
  },
];

function applyFix(fix, dryRun = true) {
  const filePath = path.join(rootDir, fix.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fix.file}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  if (fix.append) {
    // Append to end of file or after @layer overrides
    if (content.includes('@layer overrides')) {
      // Find the closing brace of @layer overrides
      const layerMatch = content.match(/(@layer overrides\s*\{[^}]*)(\})/s);
      if (layerMatch) {
        const newContent = fix.replace.replace(/\$1/g, layerMatch[1]);
        content = content.replace(layerMatch[0], `${newContent  }\n${  layerMatch[2]}`);
      } else {
        // Append at end
        content += `\n\n${  fix.replace.replace(/\$1/g, '')}`;
      }
    } else {
      // Add @layer overrides at end
      content += `\n\n@layer overrides {\n  ${fix.replace.replace(/\$1/g, '').replace(/@layer overrides\s*\{/, '').trim()}\n}`;
    }
  } else {
    // Simple find/replace
    content = content.replace(fix.find, fix.replace);
  }
  
  if (content !== originalContent) {
    if (!dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Applied: ${fix.name}`);
      return true;
    } else {
      console.log(`📝 Would apply: ${fix.name}`);
      return true;
    }
  } else {
    console.log(`⏭️  Already applied or no match: ${fix.name}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  
  console.log('🔧 Quick Fixes Script\n');
  console.log(apply ? '🚀 APPLYING FIXES...\n' : '🔍 DRY RUN - Preview only\n');
  
  let appliedCount = 0;
  
  CRITICAL_FIXES.forEach(fix => {
    if (applyFix(fix, !apply)) {
      if (apply) {
        appliedCount++;
      }
    }
  });
  
  console.log(`\n${apply ? '✨' : '💡'} ${apply ? `Applied ${appliedCount} fix(es)` : 'Run with --apply to apply fixes'}`);
  
  if (apply) {
    console.log('\n📋 Next steps:');
    console.log('1. Restart dev server: npm start');
    console.log('2. Hard refresh browser (Cmd+Shift+R)');
    console.log('3. Check if buttons have white text');
    console.log('4. Check if cards have consistent padding');
  }
}

main().catch(console.error);
