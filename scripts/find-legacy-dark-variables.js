#!/usr/bin/env node

/**
 * Find Legacy --dark-* CSS Variables
 * 
 * Scans codebase for legacy dark mode variables that should be replaced
 * with design system tokens.
 * 
 * Usage:
 *   node scripts/find-legacy-dark-variables.js
 *   node scripts/find-legacy-dark-variables.js --fix
 */

import fs from 'fs';
import { glob } from 'glob';

// Only match CSS variables (starting with --)
const LEGACY_PATTERNS = [
  /--dark-[a-z-]+/gi,
  /--dark[A-Z][a-zA-Z]*/g,
];

const DESIGN_SYSTEM_MAPPING = {
  // Surface colors
  '--dark-surface': '--surface-primary',
  '--dark-surface-primary': '--surface-primary',
  '--dark-surface-secondary': '--surface-secondary',
  '--dark-bg': '--surface-primary',
  '--dark-background': '--surface-primary',
  
  // Text colors
  '--dark-text': '--color-text-primary',
  '--dark-text-primary': '--color-text-primary',
  '--dark-text-secondary': '--color-text-secondary',
  '--dark-color': '--color-text-primary',
  
  // Border colors
  '--dark-border': '--color-border-primary',
  '--dark-border-primary': '--color-border-primary',
  
  // Generic dark-* pattern
  '--dark-': '--', // Remove dark- prefix, use semantic tokens
};

const FILE_EXTENSIONS = ['.scss', '.css', '.ts', '.html'];

async function findFiles() {
  const patterns = FILE_EXTENSIONS.map(ext => `**/*${ext}`);
  const files = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.angular/**',
        '**/backups/**',
        '**/*.min.css',
        '**/vendor/**',
        '**/playwright-report/**',
        '**/*.spec.ts', // Exclude test files
      ],
      cwd: process.cwd(),
    });
    files.push(...matches);
  }
  
  return [...new Set(files)];
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  LEGACY_PATTERNS.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const variable = match[0];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = content.split('\n')[lineNumber - 1].trim();
      
      issues.push({
        file: filePath,
        variable,
        line: lineNumber,
        context: line,
        replacement: DESIGN_SYSTEM_MAPPING[variable] || findReplacement(variable),
      });
    }
  });
  
  return issues;
}

function findReplacement(variable) {
  // Try to infer replacement from variable name
  if (variable.includes('surface') || variable.includes('bg') || variable.includes('background')) {
    return '--surface-primary';
  }
  if (variable.includes('text') || variable.includes('color')) {
    return '--color-text-primary';
  }
  if (variable.includes('border')) {
    return '--color-border-primary';
  }
  return '--surface-primary'; // Default fallback
}

function fixFile(filePath, issues) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  issues.forEach(issue => {
    if (issue.replacement) {
      const regex = new RegExp(issue.variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(issue.variable)) {
        content = content.replace(regex, issue.replacement);
        modified = true;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  console.log('🔍 Scanning for legacy --dark-* variables...\n');
  
  const files = await findFiles();
  const allIssues = [];
  
  files.forEach(file => {
    const issues = scanFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
  });
  
  // Group by file
  const issuesByFile = {};
  allIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  // Report
  console.log(`Found ${allIssues.length} legacy variable usage(s) across ${Object.keys(issuesByFile).length} file(s)\n`);
  
  Object.entries(issuesByFile).forEach(([file, issues]) => {
    console.log(`📄 ${file}`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.variable}`);
      console.log(`   Context: ${issue.context.substring(0, 60)}...`);
      if (issue.replacement) {
        console.log(`   → Replace with: ${issue.replacement}`);
      }
      console.log('');
    });
  });
  
  // Summary
  const uniqueVariables = [...new Set(allIssues.map(i => i.variable))];
  console.log('\n📊 Summary:');
  console.log(`   Total files: ${Object.keys(issuesByFile).length}`);
  console.log(`   Total issues: ${allIssues.length}`);
  console.log(`   Unique variables: ${uniqueVariables.length}`);
  console.log(`   Variables: ${uniqueVariables.join(', ')}`);
  
  // Fix if requested
  if (shouldFix) {
    console.log('\n🔧 Applying fixes...\n');
    let fixedCount = 0;
    
    Object.entries(issuesByFile).forEach(([file, issues]) => {
      if (fixFile(file, issues)) {
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
      }
    });
    
    console.log(`\n✨ Fixed ${fixedCount} file(s)`);
  } else {
    console.log('\n💡 Run with --fix to automatically replace variables');
  }
}

main().catch(console.error);
