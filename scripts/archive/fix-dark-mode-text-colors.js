/* eslint-disable no-console */
// Script to fix all dark text colors to white/light grey in dark mode
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dark colors that should be replaced with light colors in dark mode
const darkTextColors = {
  // Dark greys/blacks -> White/Light grey
  "#1f2937": "var(--dark-text-primary)",
  "#374151": "var(--dark-text-secondary)",
  "#4b5563": "var(--dark-text-secondary)",
  "#6b7280": "var(--dark-text-muted)",
  "#9ca3af": "var(--dark-text-muted)",
  "#111827": "var(--dark-text-primary)",
  "#0f172a": "var(--dark-text-primary)",
  "#1e293b": "var(--dark-text-primary)",
  "#334155": "var(--dark-text-secondary)",
  "#475569": "var(--dark-text-secondary)",
  "#64748b": "var(--dark-text-muted)",
  "#94a3b8": "var(--dark-text-muted)",
  "#0c4a6e": "var(--dark-text-primary)",
  "#1e3a8a": "var(--dark-text-primary)",
  "#92400e": "var(--dark-text-primary)",
  "#78350f": "var(--dark-text-secondary)",
  "#991b1b": "var(--dark-text-primary)",
  "#7f1d1d": "var(--dark-text-primary)",
  "#be185d": "var(--dark-text-primary)",
  "#9d174d": "var(--dark-text-primary)",
  "#047857": "var(--dark-text-primary)",
  "#065f46": "var(--dark-text-secondary)",
  "#14532d": "var(--dark-text-secondary)",
  "#15803d": "var(--dark-text-primary)",
};

function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat &&
      stat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules" &&
      file !== "docs" &&
      file !== "netlify"
    ) {
      results = results.concat(getAllHtmlFiles(filePath));
    } else if (
      file.endsWith(".html") &&
      !file.includes("design-system-example")
    ) {
      results.push(filePath);
    }
  });

  return results;
}

function fixDarkTextColors(content) {
  let updated = content;

  // Replace dark text colors in inline styles
  Object.entries(darkTextColors).forEach(([darkColor, lightColor]) => {
    // Replace in color: property
    const colorRegex = new RegExp(
      `color:\\s*${darkColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "gi",
    );
    updated = updated.replace(colorRegex, `color: ${lightColor}`);

    // Replace in style attributes
    const styleRegex = new RegExp(
      `style="([^"]*?)color:\\s*${darkColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^"]*?)"`,
      "gi",
    );
    updated = updated.replace(styleRegex, `style="$1color: ${lightColor}$2"`);
  });

  // Fix specific patterns
  // Dark grey text on dark backgrounds
  updated = updated.replace(
    /style="([^"]*?)color:\s*#([1-4][0-9a-fA-F]{5}|[1-9a-fA-F][0-9a-fA-F]{2})([^"]*?)"/gi,
    (match, before, color, after) => {
      // Check if it's a dark color (starts with 1-4 or low hex values)
      const upperColor = `#${color.toUpperCase()}`;
      if (darkTextColors[upperColor]) {
        return `style="${before}color: ${darkTextColors[upperColor]}${after}"`;
      }
      return match;
    },
  );

  // Fix buttons with dark text
  updated = updated.replace(
    /style="([^"]*?)background[^"]*?color:\s*#([1-4][0-9a-fA-F]{5}|[1-9a-fA-F][0-9a-fA-F]{2})([^"]*?)"/gi,
    (match, before, color, _after) => {
      const upperColor = `#${color.toUpperCase()}`;
      if (
        darkTextColors[upperColor] &&
        !match.includes("background: var(--primary")
      ) {
        return match.replace(
          `color: #${color}`,
          `color: var(--dark-text-primary)`,
        );
      }
      return match;
    },
  );

  return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`\n🔧 FIXING DARK MODE TEXT COLORS\n`);
console.log(`Processing ${htmlFiles.length} HTML files...\n`);

let fixedCount = 0;

htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = fixDarkTextColors(content);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      const relativePath = path.relative(path.join(__dirname, ".."), file);
      console.log(`✅ Fixed text colors: ${relativePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed text colors in ${fixedCount} files!\n`);
