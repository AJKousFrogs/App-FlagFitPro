// Script to ensure all icons have white/light colors for dark mode
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      !file.includes("design-system-example") &&
      ![
        "login.html",
        "register.html",
        "reset-password.html",
        "index.html",
      ].includes(file)
    ) {
      results.push(filePath);
    }
  });

  return results;
}

function updateIconColors(htmlContent) {
  let updated = htmlContent;

  // Update all data-lucide icons to have explicit white color
  // Pattern: <i data-lucide="icon-name" style="...">
  updated = updated.replace(
    /<i data-lucide="([^"]+)"([^>]*)>/g,
    (match, iconName, attrs) => {
      // Check if style attribute exists
      if (attrs.includes("style=")) {
        // Add or update color in style
        if (attrs.includes("color:")) {
          attrs = attrs.replace(
            /color:\s*[^;]+;/g,
            "color: var(--icon-color-primary);",
          );
        } else {
          attrs = attrs.replace(/style="([^"]*)"/, (m, styles) => {
            return `style="${styles}; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"`;
          });
        }
      } else {
        // Add style attribute with white color
        attrs +=
          ' style="color: var(--icon-color-primary); stroke: var(--icon-color-primary);"';
      }
      return `<i data-lucide="${iconName}"${attrs}>`;
    },
  );

  // Update icons in sidebar to use muted color (will be overridden by CSS for active)
  updated = updated.replace(
    /<a href="[^"]*" class="sidebar-icon[^"]*"[^>]*>\s*<i data-lucide="([^"]+)"([^>]*)>/g,
    (match, iconName, attrs) => {
      if (attrs.includes("style=")) {
        attrs = attrs.replace(/style="([^"]*)"/, (m, styles) => {
          // Remove existing color/stroke if present
          const newStyles = styles
            .replace(/color:\s*[^;]+;/g, "")
            .replace(/stroke:\s*[^;]+;/g, "");
          return `style="${newStyles}; color: var(--icon-color-muted); stroke: var(--icon-color-muted);"`;
        });
      } else {
        attrs +=
          ' style="color: var(--icon-color-muted); stroke: var(--icon-color-muted);"';
      }
      return match.replace(
        /<i data-lucide="[^"]+"([^>]*)>/,
        `<i data-lucide="${iconName}"${attrs}>`,
      );
    },
  );

  // Update search icon
  updated = updated.replace(
    /<span class="search-icon">\s*<i data-lucide="([^"]+)"([^>]*)>/g,
    (match, iconName, attrs) => {
      if (attrs.includes("style=")) {
        attrs = attrs.replace(/style="([^"]*)"/, (m, styles) => {
          return `style="${styles}; color: var(--icon-color-muted); stroke: var(--icon-color-muted);"`;
        });
      } else {
        attrs +=
          ' style="color: var(--icon-color-muted); stroke: var(--icon-color-muted);"';
      }
      return `<span class="search-icon"><i data-lucide="${iconName}"${attrs}>`;
    },
  );

  // Update header icons
  updated = updated.replace(
    /<div class="header-icon"[^>]*>\s*<i data-lucide="([^"]+)"([^>]*)>/g,
    (match, iconName, attrs) => {
      if (attrs.includes("style=")) {
        attrs = attrs.replace(/style="([^"]*)"/, (m, styles) => {
          return `style="${styles}; color: var(--icon-color-secondary); stroke: var(--icon-color-secondary);"`;
        });
      } else {
        attrs +=
          ' style="color: var(--icon-color-secondary); stroke: var(--icon-color-secondary);"';
      }
      return match.replace(
        /<i data-lucide="[^"]+"([^>]*)>/,
        `<i data-lucide="${iconName}"${attrs}>`,
      );
    },
  );

  return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`Updating icon colors in ${htmlFiles.length} HTML files...\n`);

htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = updateIconColors(content);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(
        `✅ Updated icons: ${path.relative(path.join(__dirname, ".."), file)}`,
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${file}:`, error.message);
  }
});

console.log("\n✨ Icon color update complete!");
