/**
 * Storage Migration Script
 * Migrates files from old storage patterns to unified storage service
 *
 * NOTE: Deprecated storage functions have been removed from shared.js.
 * This script helps migrate any remaining legacy code.
 *
 * Handles:
 * 1. Imports from shared.js (saveToStorage, getFromStorage, removeFromStorage) - REMOVED
 * 2. Imports from old storageService.js
 * 3. Function call replacements
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Files to migrate (found via grep analysis)
const filesToMigrate = [
  // Files using shared.js storage utilities
  "src/js/pages/chat-page.js",
  "src/js/pages/training-page.js",
  "src/js/pages/exercise-library-page.js",
  "src/js/pages/settings-page.js",

  // Files using old storageService.js
  "src/js/components/schedule-builder-modal.js",
];

/**
 * Calculate correct import path for storage-service-unified.js
 */
function getStorageServiceImportPath(filePath) {
  const fileDir = path.dirname(filePath);
  const targetPath = "src/js/services/storage-service-unified.js";
  const relativePath = path.relative(fileDir, path.join(rootDir, targetPath));

  // Ensure it starts with ./
  return relativePath.startsWith(".") ? relativePath : "./" + relativePath;
}

/**
 * Migrate a single file
 */
function migrateFile(relativePath) {
  const filePath = path.join(rootDir, relativePath);

  try {
    let content = fs.readFileSync(filePath, "utf8");
    let updated = false;
    const changes = [];

    // Step 1: Remove old storage imports from shared.js
    const sharedStorageImportPattern =
      /import\s+\{[^}]*(?:saveToStorage|getFromStorage|removeFromStorage)[^}]*\}\s+from\s+['"]\.\.\/utils\/shared\.js['"];?\n?/;

    if (sharedStorageImportPattern.test(content)) {
      // Extract other imports from shared.js that we need to keep
      const match = content.match(
        /import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/utils\/shared\.js['"]/,
      );

      if (match) {
        const imports = match[1]
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i);
        const storageImports = [
          "saveToStorage",
          "getFromStorage",
          "removeFromStorage",
        ];
        const keepImports = imports.filter(
          (imp) => !storageImports.includes(imp),
        );

        if (keepImports.length > 0) {
          // Keep the import but remove storage functions
          const newImport = `import {\n  ${keepImports.join(",\n  ")},\n} from "../utils/shared.js";`;
          content = content.replace(match[0], newImport);
        } else {
          // Remove the entire import
          content = content.replace(sharedStorageImportPattern, "");
        }

        updated = true;
        changes.push("Removed storage imports from shared.js");
      }
    }

    // Step 2: Remove old storageService.js import
    const oldStorageServicePattern =
      /import\s+\{[^}]*storageService[^}]*\}\s+from\s+['"]\.\.\/services\/storageService\.js['"];?\n?/;

    if (oldStorageServicePattern.test(content)) {
      content = content.replace(oldStorageServicePattern, "");
      updated = true;
      changes.push("Removed old storageService.js import");
    }

    // Step 3: Add new unified storage service import
    if (updated) {
      const importPath = getStorageServiceImportPath(relativePath);
      const newImport = `import { storageService } from "${importPath}";\n`;

      // Find where to insert the import (after other imports)
      const importSectionEnd = content.lastIndexOf("import ");
      if (importSectionEnd !== -1) {
        const lineEnd = content.indexOf("\n", importSectionEnd);
        content =
          content.slice(0, lineEnd + 1) +
          newImport +
          content.slice(lineEnd + 1);
        changes.push("Added unified storageService import");
      }
    }

    // Step 4: Replace function calls
    let functionCallsReplaced = 0;

    // saveToStorage(key, data) -> storageService.set(key, data)
    const savePattern = /\bsaveToStorage\(/g;
    const saveMatches = content.match(savePattern);
    if (saveMatches) {
      content = content.replace(savePattern, "storageService.set(");
      functionCallsReplaced += saveMatches.length;
      updated = true;
    }

    // getFromStorage(key, default) -> storageService.get(key, default)
    const getPattern = /\bgetFromStorage\(/g;
    const getMatches = content.match(getPattern);
    if (getMatches) {
      content = content.replace(getPattern, "storageService.get(");
      functionCallsReplaced += getMatches.length;
      updated = true;
    }

    // removeFromStorage(key) -> storageService.remove(key)
    const removePattern = /\bremoveFromStorage\(/g;
    const removeMatches = content.match(removePattern);
    if (removeMatches) {
      content = content.replace(removePattern, "storageService.remove(");
      functionCallsReplaced += removeMatches.length;
      updated = true;
    }

    if (functionCallsReplaced > 0) {
      changes.push(`Replaced ${functionCallsReplaced} storage function calls`);
    }

    // Step 5: Check for old storageService method calls that need updating
    // The old service had methods like getRecentWorkouts(), getCurrentWorkout(), etc.
    // These are maintained in the new service, so they should work as-is
    // But we log them for verification
    const oldServiceMethods = [
      "getRecentWorkouts",
      "saveWorkoutSession",
      "getCurrentWorkout",
      "setCurrentWorkout",
      "clearCurrentWorkout",
      "getScheduleSettings",
      "saveScheduleSettings",
    ];

    oldServiceMethods.forEach((method) => {
      const pattern = new RegExp(`storageService\\.${method}\\(`, "g");
      const matches = content.match(pattern);
      if (matches) {
        changes.push(
          `Found ${matches.length} calls to storageService.${method}() (preserved)`,
        );
      }
    });

    // Write updated content back to file
    if (updated) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Successfully migrated ${relativePath}`);
      changes.forEach((change) => console.log(`   - ${change}`));
      console.log("");
      return { success: true, changes };
    } else {
      console.log(`ℹ️  No changes needed for ${relativePath}`);
      console.log("");
      return { success: false, changes: [] };
    }
  } catch (error) {
    console.error(`❌ Error migrating ${relativePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main execution
console.log("🚀 Starting storage service migration...\n");
console.log(`📝 Found ${filesToMigrate.length} files to migrate\n`);

let successCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const file of filesToMigrate) {
  const result = migrateFile(file);
  if (result.success) {
    successCount++;
  } else if (result.error) {
    errorCount++;
  } else {
    skippedCount++;
  }
}

console.log("\n📊 Summary:");
console.log(`   ✅ Successfully migrated: ${successCount} files`);
console.log(`   ⏭️  Skipped/No changes: ${skippedCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
console.log(`   📝 Total files processed: ${filesToMigrate.length}`);
console.log("\n✨ Storage migration complete!");
console.log("\n📌 Next steps:");
console.log("   1. Test migrated files to ensure they work correctly");
console.log(
  "   2. Review files with direct localStorage access for manual migration",
);
console.log("   3. Consider deprecating old storage utilities in shared.js");
