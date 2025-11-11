#!/usr/bin/env node

/**
 * Apply Comprehensive Spacing System to All HTML Pages
 * 
 * This script adds the spacing-system.css to all HTML pages
 * that don't already have it, ensuring consistent spacing
 * across the entire application.
 */

const fs = require('fs');
const path = require('path');

const HTML_DIR = path.join(__dirname, '..');
const SPACING_CSS = './src/spacing-system.css';
const DESIGN_SYSTEM_CSS = './src/comprehensive-design-system.css';

// Find all HTML files
function findHTMLFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findHTMLFiles(fullPath));
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Check if spacing-system.css is already linked
function hasSpacingSystem(content) {
  return content.includes('spacing-system.css');
}

// Add spacing-system.css after comprehensive-design-system.css
function addSpacingSystem(content) {
  // Pattern to find comprehensive-design-system.css link
  const designSystemPattern = /(<link[^>]*href=["']\.\/src\/comprehensive-design-system\.css["'][^>]*>)/i;
  
  if (designSystemPattern.test(content)) {
    // Add spacing-system.css right after comprehensive-design-system.css
    const replacement = `$1\n    <link rel="stylesheet" href="${SPACING_CSS}">`;
    return content.replace(designSystemPattern, replacement);
  } else {
    // If no design system link found, add both before </head>
    const headPattern = /(<\/head>)/i;
    if (headPattern.test(content)) {
      return content.replace(
        headPattern,
        `    <link rel="stylesheet" href="${DESIGN_SYSTEM_CSS}">\n    <link rel="stylesheet" href="${SPACING_CSS}">\n$1`
      );
    }
  }
  
  return content;
}

// Main execution
function main() {
  console.log('🎨 Applying Comprehensive Spacing System to all HTML pages...\n');
  
  const htmlFiles = findHTMLFiles(HTML_DIR);
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const filePath of htmlFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(HTML_DIR, filePath);
      
      if (hasSpacingSystem(content)) {
        console.log(`⏭️  Skipped: ${relativePath} (already has spacing-system.css)`);
        skipped++;
        continue;
      }
      
      const updatedContent = addSpacingSystem(content);
      
      if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`✅ Updated: ${relativePath}`);
        updated++;
      } else {
        console.log(`⚠️  No changes: ${relativePath} (could not find insertion point)`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Updated: ${updated} files`);
  console.log(`   ⏭️  Skipped: ${skipped} files`);
  console.log(`   ❌ Errors: ${errors} files`);
  console.log(`\n🎉 Spacing system applied! All pages now have consistent, breathable spacing.`);
}

main();

