/* eslint-disable no-console */
/**
 * Automated Script to Replace Footer with Dynamic Component
 * Replaces footer HTML markup with dynamic loader across multiple files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// All HTML files to update (get all HTML files in root)
const getAllHtmlFiles = () => {
  return fs.readdirSync(rootDir)
    .filter(file => file.endsWith('.html') && !file.startsWith('.'));
};

const filesToUpdate = getAllHtmlFiles();

// Footer loader script tag to add
const footerLoaderScript = `    <!-- Footer Loader (Dynamic Component) -->
    <script src="./src/js/components/footer-loader.js" defer></script>`;

// Replacement for footer markup
const footerContainerReplacement = `    <!-- Footer (Loaded Dynamically) -->
    <div data-footer-container></div>`;

function updateFile(fileName) {
  const filePath = path.join(rootDir, fileName);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Step 1: Add footer-loader script before </head> if not already present
    if (!content.includes('footer-loader.js')) {
      content = content.replace('  </head>', `${footerLoaderScript}\n  </head>`);
      updated = true;
      console.log(`✓ Added footer-loader script to ${fileName}`);
    }

    // Step 2: Find and replace the footer markup
    // Pattern to match: from <!-- Footer --> to </footer>
    const footerPatterns = [
      // Pattern 1: Main footer
      /<!--\s*Footer\s*-->\s*<footer[^>]*class="main-footer"[^>]*>[\s\S]*?<\/footer>/,

      // Pattern 2: Landing footer
      /<!--\s*Footer\s*-->\s*<footer[^>]*class="landing-footer"[^>]*>[\s\S]*?<\/footer>/,

      // Pattern 3: Generic footer
      /<!--\s*Footer\s*-->\s*<footer[\s\S]*?<\/footer>/,
    ];

    let footerReplaced = false;
    for (const pattern of footerPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, footerContainerReplacement);
        footerReplaced = true;
        console.log(`✓ Replaced footer markup in ${fileName}`);
        updated = true;
        break;
      }
    }

    if (!footerReplaced) {
      // Check if footer exists at all
      if (content.includes('<footer')) {
        console.warn(`⚠ Found footer but couldn't match pattern in ${fileName} - manual update needed`);
      } else {
        console.log(`ℹ️  No footer found in ${fileName} (might be intentional)`);
      }
    }

    // Write updated content back to file
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Successfully updated ${fileName}\n`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed for ${fileName}\n`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${fileName}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Starting footer component replacement...\n');
console.log(`📝 Found ${filesToUpdate.length} HTML files to process\n`);

let successCount = 0;
let skippedCount = 0;

for (const fileName of filesToUpdate) {
  const result = updateFile(fileName);
  if (result) {
    successCount++;
  } else {
    skippedCount++;
  }
}

console.log('\n📊 Summary:');
console.log(`   ✅ Successfully updated: ${successCount} files`);
console.log(`   ⏭️  Skipped/No changes: ${skippedCount} files`);
console.log(`   📝 Total files processed: ${filesToUpdate.length}`);
console.log('\n✨ Footer component replacement complete!');
