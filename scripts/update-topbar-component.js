/* eslint-disable no-console */
/**
 * Automated Script to Replace Top Bar with Dynamic Component
 * Replaces top bar HTML markup with dynamic loader across multiple files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files to update
const filesToUpdate = [
  'dashboard.html',
  'profile.html',
  'roster.html',
  'training.html',
  'analytics.html',
  'performance-tracking.html',
  'game-tracker.html',
  'wellness.html',
  'settings.html',
  'tournaments.html',
  'community.html',
  'workout.html',
  'exercise-library.html',
  'coach.html',
];

// Top bar loader script tag to add
const topBarLoaderScript = `    <!-- Top Bar Loader (Dynamic Component) -->
    <script src="./src/js/components/top-bar-loader.js" defer></script>`;

// Replacement for top bar markup
const topBarContainerReplacement = `        <!-- Top Bar (Loaded Dynamically) -->
        <div data-topbar-container></div>`;

function updateFile(fileName) {
  const filePath = path.join(rootDir, fileName);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Step 1: Add top-bar-loader script before </head> if not already present
    if (!content.includes('top-bar-loader.js')) {
      content = content.replace('  </head>', `${topBarLoaderScript}\n  </head>`);
      updated = true;
      console.log(`✓ Added top-bar-loader script to ${fileName}`);
    }

    // Step 2: Find and replace the top bar markup
    // Pattern to match: from <!-- Top Bar --> to end of top-bar div
    const topBarPatterns = [
      // Pattern 1: Complete top bar with all elements
      /<!--\s*Top Bar\s*-->\s*<div class="top-bar"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>(?=\s*<!--|\s*<div)/,

      // Pattern 2: Simpler pattern
      /<!--\s*Top Bar\s*-->\s*<div class="top-bar"[\s\S]*?<!--\s*Player Dashboard|<!--\s*Page Content|<!--\s*Main Content|<div class="dashboard-main/,
    ];

    let topBarReplaced = false;
    for (const pattern of topBarPatterns) {
      const match = content.match(pattern);
      if (match) {
        // Replace but keep the trailing comment/div
        const matchedText = match[0];
        const trailingPart = matchedText.match(/(<!--[\s\S]*?)$/);

        if (trailingPart) {
          content = content.replace(matchedText, topBarContainerReplacement + '\n\n        ' + trailingPart[1]);
        } else {
          content = content.replace(matchedText, topBarContainerReplacement + '\n\n        ');
        }

        topBarReplaced = true;
        console.log(`✓ Replaced top bar markup in ${fileName}`);
        updated = true;
        break;
      }
    }

    if (!topBarReplaced) {
      console.warn(`⚠ Could not find top bar pattern in ${fileName} - manual update needed`);
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
console.log('🚀 Starting top bar component replacement...\n');

let successCount = 0;
let failureCount = 0;

for (const fileName of filesToUpdate) {
  const result = updateFile(fileName);
  if (result) {
    successCount++;
  } else {
    failureCount++;
  }
}

console.log('\n📊 Summary:');
console.log(`   ✅ Successfully updated: ${successCount} files`);
console.log(`   ⚠️  Failed or skipped: ${failureCount} files`);
console.log(`   📝 Total files processed: ${filesToUpdate.length}`);
console.log('\n✨ Top bar component replacement complete!');
