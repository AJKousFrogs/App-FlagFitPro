#!/usr/bin/env node

/**
 * Build script for FlagFit Pro
 * Minifies CSS and JavaScript for production
 * 
 * Usage: node scripts/build.js
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

console.log('🏗️  Building FlagFit Pro for production...\n');

// Create dist directory if it doesn't exist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

// Check if required tools are available
try {
  console.log('📦 Checking build tools...');
  
  // Check for postcss-cli (for CSS minification)
  try {
    execSync('npx postcss --version', { stdio: 'ignore' });
    console.log('✅ PostCSS available');
  } catch (e) {
    console.warn('⚠️  PostCSS not found. Install with: npm install --save-dev postcss-cli postcss');
  }

  // Check for esbuild (for JS minification)
  try {
    execSync('npx esbuild --version', { stdio: 'ignore' });
    console.log('✅ esbuild available');
  } catch (e) {
    console.warn('⚠️  esbuild not found. Install with: npm install --save-dev esbuild');
  }

  console.log('\n📝 Note: This is a basic build script.');
  console.log('   For full minification, install build tools and configure properly.\n');

  console.log('✅ Build script ready');
  console.log('\n💡 To enable full minification:');
  console.log('   1. npm install --save-dev postcss-cli postcss cssnano');
  console.log('   2. npm install --save-dev esbuild');
  console.log('   3. Configure postcss.config.js');
  console.log('   4. Update this script with actual build commands\n');

} catch (error) {
  console.error('❌ Build setup error:', error.message);
  process.exit(1);
}

console.log('✨ Build script completed');

