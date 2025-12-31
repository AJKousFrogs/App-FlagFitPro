/**
 * Automated Script to Replace Sidebar with Dynamic Component
 * Replaces sidebar HTML markup with dynamic loader across multiple files
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Files to update
const filesToUpdate = [
  "roster.html",
  "training.html",
  "analytics.html",
  "performance-tracking.html",
  "game-tracker.html",
  "wellness.html",
  "settings.html",
  "tournaments.html",
  "community.html",
  "workout.html",
  "exercise-library.html",
  "coach.html",
  "chat.html",
];

// Sidebar loader script tag to add
const sidebarLoaderScript = `    <!-- Sidebar Loader (Dynamic Component) -->
    <script src="./src/js/components/sidebar-loader.js" defer></script>`;

// Replacement for sidebar markup
const sidebarContainerReplacement = `      <!-- Unified Sidebar Navigation (Loaded Dynamically) -->
      <div data-sidebar-container></div>`;

function updateFile(fileName) {
  const filePath = path.join(rootDir, fileName);

  try {
    let content = fs.readFileSync(filePath, "utf8");
    let updated = false;

    // Step 1: Add sidebar-loader script before </head> if not already present
    if (!content.includes("sidebar-loader.js")) {
      content = content.replace(
        "  </head>",
        `${sidebarLoaderScript}\n  </head>`,
      );
      updated = true;
      console.log(`✓ Added sidebar-loader script to ${fileName}`);
    }

    // Step 2: Find and replace the sidebar markup
    // Pattern to match: from sidebar start to sidebar end (including menu-scrim if present)
    const sidebarPatterns = [
      // Pattern 1: With menu-scrim
      /<!--\s*Mobile Overlay\/Scrim.*?-->\s*<div class="menu-scrim"[^>]*><\/div>\s*<!--\s*Unified Sidebar Navigation.*?-->\s*<div\s+class="sidebar"[\s\S]*?<\/div>\s*(?=<!--\s*Top Bar|<main|<div class="top-bar")/,

      // Pattern 2: Without menu-scrim
      /<!--\s*Unified Sidebar Navigation.*?-->\s*<div\s+class="sidebar"[\s\S]*?<\/div>\s*<!--\s*Sidebar Overlay.*?-->\s*<div[^>]*class="sidebar-overlay"[^>]*><\/div>\s*/,

      // Pattern 3: Simplified pattern
      /<!--\s*Unified Sidebar.*?-->\s*<div[^>]*class="sidebar"[^>]*>[\s\S]*?<\/nav>\s*<\/div>(?:\s*<!--\s*Sidebar Overlay.*?-->\s*<div[^>]*sidebar-overlay[^>]*><\/div>)?/,
    ];

    let sidebarReplaced = false;
    for (const pattern of sidebarPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, `${sidebarContainerReplacement  }\n`);
        sidebarReplaced = true;
        console.log(`✓ Replaced sidebar markup in ${fileName}`);
        updated = true;
        break;
      }
    }

    if (!sidebarReplaced) {
      console.warn(
        `⚠ Could not find sidebar pattern in ${fileName} - manual update needed`,
      );
    }

    // Write updated content back to file
    if (updated) {
      fs.writeFileSync(filePath, content, "utf8");
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
console.log("🚀 Starting sidebar component replacement...\n");

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

console.log("\n📊 Summary:");
console.log(`   ✅ Successfully updated: ${successCount} files`);
console.log(`   ⚠️  Failed or skipped: ${failureCount} files`);
console.log(`   📝 Total files processed: ${filesToUpdate.length}`);
console.log("\n✨ Sidebar component replacement complete!");
