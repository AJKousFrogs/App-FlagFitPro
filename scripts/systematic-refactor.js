#!/usr/bin/env node

/**
 * Systematic Design System Refactoring Script
 * 
 * Refactors components one-by-one to use design system tokens.
 * 
 * Usage:
 *   node scripts/systematic-refactor.js --component today
 *   node scripts/systematic-refactor.js --screen dashboard
 *   node scripts/systematic-refactor.js --all
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SPACING_REPLACEMENTS = {
  '4px': 'var(--space-1)',
  '8px': 'var(--space-2)',
  '12px': 'var(--space-3)',
  '16px': 'var(--space-4)',
  '20px': 'var(--space-5)',
  '24px': 'var(--space-6)',
  '32px': 'var(--space-8)',
  '40px': 'var(--space-10)',
  '48px': 'var(--space-12)',
  '0.25rem': 'var(--space-1)',
  '0.5rem': 'var(--space-2)',
  '0.75rem': 'var(--space-3)',
  '1rem': 'var(--space-4)',
  '1.5rem': 'var(--space-6)',
  '2rem': 'var(--space-8)',
  '3rem': 'var(--space-12)',
};

const FONT_SIZE_REPLACEMENTS = {
  '1.5rem': 'var(--font-heading-lg)',
  '1.125rem': 'var(--font-heading-sm)',
  '1rem': 'var(--font-body-md)',
  '0.875rem': 'var(--font-body-sm)',
  '0.75rem': 'var(--font-body-xs)',
};

const COLOR_REPLACEMENTS = {
  '#089949': 'var(--ds-primary-green)',
  '#036d35': 'var(--ds-primary-green-hover)',
  '#0ab85a': 'var(--ds-primary-green-light)',
  '#ffffff': 'var(--color-text-on-primary)',
  '#1a1a1a': 'var(--color-text-primary)',
  '#4a4a4a': 'var(--color-text-secondary)',
  '#525252': 'var(--color-text-muted)',
};

const RADIUS_REPLACEMENTS = {
  '6px': 'var(--radius-sm)',
  '8px': 'var(--radius-md)',
  '12px': 'var(--radius-lg)',
  '16px': 'var(--radius-xl)',
};

function findComponentFiles(componentName) {
  const patterns = [
    `**/${componentName}.component.ts`,
    `**/${componentName}.component.scss`,
    `**/${componentName}.component.html`,
  ];
  
  return glob(patterns[0], {
    ignore: ['**/node_modules/**', '**/dist/**'],
    cwd: path.join(process.cwd(), 'angular/src'),
  });
}

function refactorFile(filePath, dryRun = false) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const changes = [];
  
  // Replace spacing values
  Object.entries(SPACING_REPLACEMENTS).forEach(([old, replacement]) => {
    const regex = new RegExp(`\\b${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (content.match(regex)) {
      const matches = content.match(regex);
      content = content.replace(regex, replacement);
      changes.push({
        type: 'spacing',
        old,
        replacement,
        count: matches.length,
      });
    }
  });
  
  // Replace font sizes
  Object.entries(FONT_SIZE_REPLACEMENTS).forEach(([old, replacement]) => {
    const regex = new RegExp(`font-size:\\s*${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (content.match(regex)) {
      const matches = content.match(regex);
      content = content.replace(regex, `font-size: ${replacement}`);
      changes.push({
        type: 'font-size',
        old,
        replacement,
        count: matches.length,
      });
    }
  });
  
  // Replace colors
  Object.entries(COLOR_REPLACEMENTS).forEach(([old, replacement]) => {
    const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.match(regex)) {
      const matches = content.match(regex);
      content = content.replace(regex, replacement);
      changes.push({
        type: 'color',
        old,
        replacement,
        count: matches.length,
      });
    }
  });
  
  // Replace border radius
  Object.entries(RADIUS_REPLACEMENTS).forEach(([old, replacement]) => {
    const regex = new RegExp(`border-radius:\\s*${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (content.match(regex)) {
      const matches = content.match(regex);
      content = content.replace(regex, `border-radius: ${replacement}`);
      changes.push({
        type: 'radius',
        old,
        replacement,
        count: matches.length,
      });
    }
  });
  
  if (!dryRun && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return {
    file: filePath,
    changed: content !== originalContent,
    changes,
  };
}

async function refactorComponent(componentName, dryRun = false) {
  console.log(`\n🔧 Refactoring component: ${componentName}\n`);
  
  const files = await findComponentFiles(componentName);
  
  if (files.length === 0) {
    console.log(`❌ No files found for component: ${componentName}`);
    return;
  }
  
  const results = [];
  
  files.forEach(file => {
    const result = refactorFile(file, dryRun);
    results.push(result);
    
    if (result.changed) {
      console.log(`✅ ${file}`);
      result.changes.forEach(change => {
        console.log(`   ${change.type}: ${change.old} → ${change.replacement} (${change.count}x)`);
      });
    } else {
      console.log(`⏭️  ${file} (no changes)`);
    }
  });
  
  const changedCount = results.filter(r => r.changed).length;
  const totalChanges = results.reduce((sum, r) => sum + r.changes.length, 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files changed: ${changedCount}/${files.length}`);
  console.log(`   Total replacements: ${totalChanges}`);
  
  if (dryRun) {
    console.log(`\n💡 Run without --dry-run to apply changes`);
  }
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const componentName = args.find(arg => arg.startsWith('--component='))?.split('=')[1];
  const screenName = args.find(arg => arg.startsWith('--screen='))?.split('=')[1];
  const all = args.includes('--all');
  const dryRun = args.includes('--dry-run');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  if (componentName) {
    await refactorComponent(componentName, dryRun);
  } else if (screenName) {
    // Refactor all components in a screen/route
    console.log(`📱 Refactoring screen: ${screenName}`);
    // Implementation for screen refactoring
  } else if (all) {
    console.log('🌐 Refactoring all components...\n');
    // Find all components and refactor them
    const componentFiles = await glob('**/*.component.ts', {
      ignore: ['**/node_modules/**', '**/dist/**'],
      cwd: path.join(process.cwd(), 'angular/src'),
    });
    
    const componentNames = [...new Set(
      componentFiles.map(f => path.basename(f, '.component.ts'))
    )];
    
    for (const name of componentNames) {
      await refactorComponent(name, dryRun);
    }
  } else {
    console.log('Usage:');
    console.log('  node scripts/systematic-refactor.js --component=<name>');
    console.log('  node scripts/systematic-refactor.js --screen=<name>');
    console.log('  node scripts/systematic-refactor.js --all');
    console.log('  Add --dry-run to preview changes without modifying files');
  }
}

main().catch(console.error);
