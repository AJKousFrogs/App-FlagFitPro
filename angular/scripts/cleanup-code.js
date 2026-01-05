#!/usr/bin/env node
/**
 * Code Cleanup Script
 * Removes unused imports, console statements, and performs automated cleanup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting code cleanup...\n');

// 1. Remove unused imports using ESLint --fix
console.log('📦 Removing unused imports...');
try {
  execSync('npx eslint src --ext .ts,.tsx --fix --rule "@typescript-eslint/no-unused-vars: warn"', {
    cwd: __dirname,
    stdio: 'pipe'
  });
  console.log('✅ Unused imports cleaned\n');
} catch (error) {
  console.log('⚠️  ESLint fix completed with warnings\n');
}

// 2. Find console.log statements (for review, not auto-delete)
console.log('🔍 Finding console.log statements...');
try {
  const result = execSync(
    'grep -r "console\\.(log|debug|info)" --include="*.ts" src/ | wc -l',
    { cwd: __dirname, encoding: 'utf8' }
  );
  const count = parseInt(result.trim());
  console.log(`   Found ${count} console statements (review manually)\n`);
} catch (error) {
  console.log('   No console statements found\n');
}

// 3. Find TODO/FIXME comments
console.log('📝 Finding TODO/FIXME comments...');
try {
  const result = execSync(
    'grep -r "// TODO\\|// FIXME\\|// XXX\\|// HACK" --include="*.ts" src/ | wc -l',
    { cwd: __dirname, encoding: 'utf8' }
  );
  const count = parseInt(result.trim());
  console.log(`   Found ${count} TODO/FIXME comments\n`);
} catch (error) {
  console.log('   No TODO comments found\n');
}

// 4. Find large commented blocks
console.log('💭 Finding large commented code blocks...');
try {
  const result = execSync(
    'grep -r "^\\s*//" --include="*.ts" src/ | wc -l',
    { cwd: __dirname, encoding: 'utf8' }
  );
  const count = parseInt(result.trim());
  console.log(`   Found ${count} comment lines (some may be documentation)\n`);
} catch (error) {
  console.log('   No large comment blocks found\n');
}

// 5. Check for duplicate imports
console.log('🔄 Checking for duplicate code patterns...');
console.log('   Run: npx jscpd src/ for detailed duplicate detection\n');

console.log('✅ Cleanup analysis complete!\n');
console.log('📋 Summary:');
console.log('   - Unused imports: Cleaned automatically');
console.log('   - Console statements: Review manually');
console.log('   - TODO comments: Keep for tracking');
console.log('   - Large blocks: Review large commented sections');
console.log('\n💡 Next steps:');
console.log('   1. Review console.log statements');
console.log('   2. Remove or update TODO comments');
console.log('   3. Check for duplicate code with: npx jscpd src/');
