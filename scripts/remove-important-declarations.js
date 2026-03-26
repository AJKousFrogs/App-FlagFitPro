#!/usr/bin/env node

/**
 * Remove !important Declarations Script
 *
 * Purpose: Automatically find and suggest fixes for !important declarations
 * Usage: node scripts/remove-important-declarations.js [--fix]
 *
 * @see FRONTEND_AUDIT_REPORT.md Section 1.1
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DRY_RUN = !process.argv.includes('--fix');
const VERBOSE = process.argv.includes('--verbose');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Known !important patterns and their replacements
 */
const IMPORTANT_PATTERNS = [
  {
    name: 'Grid column span (mobile)',
    pattern: /grid-column:\s*span\s+\d+\s*!important\s*;/g,
    replacement: (match) => {
      return match.replace(' !important', '');
    },
    context: '@media (max-width:',
    advice: 'Remove !important and ensure this is in a @layer overrides block or increase specificity',
  },
  {
    name: 'Background transparent',
    pattern: /background:\s*transparent\s*!important\s*;/g,
    replacement: 'background: transparent;',
    advice: 'Use CSS layers (@layer overrides) instead of !important',
  },
  {
    name: 'Border none',
    pattern: /border:\s*none\s*!important\s*;/g,
    replacement: 'border: none;',
    advice: 'Use CSS layers or increase specificity instead',
  },
  {
    name: 'Box shadow none',
    pattern: /box-shadow:\s*none\s*!important\s*;/g,
    replacement: 'box-shadow: none;',
    advice: 'Use CSS layers or more specific selector',
  },
  {
    name: 'Padding zero',
    pattern: /padding:\s*0\s*!important\s*;/g,
    replacement: 'padding: 0;',
    advice: 'Consider using utility class .p-0 instead',
  },
  {
    name: 'Grid template columns',
    pattern: /grid-template-columns:\s*[^;]+!important\s*;/g,
    replacement: (match) => match.replace(' !important', ''),
    advice: 'Use @layer overrides or more specific selector',
  },
  {
    name: 'Gap',
    pattern: /gap:\s*[^;]+!important\s*;/g,
    replacement: (match) => match.replace(' !important', ''),
    advice: 'Use utility classes or CSS layers',
  },
];

/**
 * Statistics tracker
 */
const stats = {
  filesScanned: 0,
  filesWithImportant: 0,
  totalImportantFound: 0,
  totalImportantRemoved: 0,
  patterns: {},
};

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}🔍 !important Declaration Scanner${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  if (DRY_RUN) {
    console.log(`${colors.yellow}⚠️  DRY RUN MODE - No files will be modified${colors.reset}`);
    console.log(`${colors.yellow}   Run with --fix to apply changes${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✅ FIX MODE - Files will be modified${colors.reset}\n`);
  }

  // Find all SCSS files
  const scssFiles = await glob('angular/src/**/*.scss', {
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  console.log(`Found ${scssFiles.length} SCSS files to scan\n`);

  // Process each file
  for (const filePath of scssFiles) {
    await processFile(filePath);
  }

  // Print summary
  printSummary();
}

/**
 * Process a single SCSS file
 */
async function processFile(filePath) {
  stats.filesScanned++;

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileChanges = [];

  // Check for any !important declarations
  const importantCount = (content.match(/!important/g) || []).length;

  if (importantCount === 0) {
    return; // Skip files without !important
  }

  stats.filesWithImportant++;
  stats.totalImportantFound += importantCount;

  console.log(`${colors.yellow}📄 ${filePath}${colors.reset}`);
  console.log(`   Found ${importantCount} !important declaration(s)\n`);

  // Apply each pattern
  for (const pattern of IMPORTANT_PATTERNS) {
    const matches = content.match(pattern.pattern);

    if (matches && matches.length > 0) {
      stats.patterns[pattern.name] = (stats.patterns[pattern.name] || 0) + matches.length;

      for (const match of matches) {
        const lineNumber = getLineNumber(content, match);

        console.log(`   ${colors.cyan}Line ${lineNumber}:${colors.reset}`);
        console.log(`   ${colors.red}  - ${match.trim()}${colors.reset}`);

        if (DRY_RUN) {
          const replacement = typeof pattern.replacement === 'function'
            ? pattern.replacement(match)
            : pattern.replacement;

          console.log(`   ${colors.green}  + ${replacement.trim()}${colors.reset}`);
          console.log(`   ${colors.blue}  ℹ ${pattern.advice}${colors.reset}\n`);
        }
      }

      if (!DRY_RUN) {
        // Apply replacement
        content = content.replace(pattern.pattern, (match) => {
          stats.totalImportantRemoved++;
          return typeof pattern.replacement === 'function'
            ? pattern.replacement(match)
            : pattern.replacement;
        });

        modified = true;
        fileChanges.push({
          pattern: pattern.name,
          count: matches.length,
        });
      }
    }
  }

  // Write changes back to file
  if (modified && !DRY_RUN) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ${colors.green}✓ Applied ${fileChanges.length} fix(es)${colors.reset}\n`);
  }

  if (VERBOSE && !modified) {
    console.log(`   ${colors.yellow}⚠ No automatic fixes available (manual review needed)${colors.reset}\n`);
  }
}

/**
 * Get line number for a match in content
 */
function getLineNumber(content, match) {
  const index = content.indexOf(match);
  return content.substring(0, index).split('\n').length;
}

/**
 * Print summary statistics
 */
function printSummary() {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}📊 Summary${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`Files scanned:              ${stats.filesScanned}`);
  console.log(`Files with !important:      ${colors.yellow}${stats.filesWithImportant}${colors.reset}`);
  console.log(`Total !important found:     ${colors.red}${stats.totalImportantFound}${colors.reset}`);

  if (!DRY_RUN) {
    console.log(`Total !important removed:   ${colors.green}${stats.totalImportantRemoved}${colors.reset}`);
    console.log(`Remaining:                  ${colors.yellow}${stats.totalImportantFound - stats.totalImportantRemoved}${colors.reset}`);
  }

  if (Object.keys(stats.patterns).length > 0) {
    console.log(`\n${colors.cyan}Patterns found:${colors.reset}`);
    for (const [name, count] of Object.entries(stats.patterns)) {
      console.log(`  - ${name}: ${count}`);
    }
  }

  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  if (DRY_RUN) {
    console.log(`\n${colors.yellow}💡 Run with --fix to apply changes${colors.reset}`);
    console.log(`${colors.yellow}   Example: node scripts/remove-important-declarations.js --fix${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}✅ Changes applied successfully!${colors.reset}`);
    console.log(`${colors.cyan}Next steps:${colors.reset}`);
    console.log(`  1. Review git diff to ensure changes are correct`);
    console.log(`  2. Test in browser to verify no visual regressions`);
    console.log(`  3. Run: npm run test:e2e`);
    console.log(`  4. Commit changes with message: "refactor: remove !important declarations"\n`);
  }

  // Show remaining manual work if any
  const remaining = stats.totalImportantFound - stats.totalImportantRemoved;
  if (remaining > 0) {
    console.log(`${colors.yellow}⚠️  ${remaining} !important declaration(s) require manual review${colors.reset}`);
    console.log(`${colors.yellow}   These may be in complex contexts or require CSS layer refactoring${colors.reset}\n`);
  }
}

// Execute
main().catch((error) => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
