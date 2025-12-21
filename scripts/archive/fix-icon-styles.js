/* eslint-disable no-console */
// Script to fix duplicate style attributes and clean up icon styles
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

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

function fixIconStyles(htmlContent) {
  let updated = htmlContent;

  // Fix duplicate semicolons and duplicate color declarations in style attributes
  updated = updated.replace(
    /style="([^"]*);;([^"]*)"/g,
    (match, part1, part2) => {
      // Remove duplicates and clean up
      let styles = (part1 + part2).split(";").filter((s) => s.trim());
      // Remove duplicate color/stroke declarations
      const seen = new Set();
      styles = styles.filter((style) => {
        const key = style.split(":")[0].trim();
        if (seen.has(key)) {return false;}
        seen.add(key);
        return true;
      });
      return `style="${styles.join("; ")}"`;
    },
  );

  // Fix icons with proper color based on context
  // Sidebar icons should use muted color (CSS will override for active)
  updated = updated.replace(
    /<a href="[^"]*" class="sidebar-icon[^"]*"[^>]*>\s*<i data-lucide="([^"]+)"[^>]*style="([^"]*)"/g,
    (match, iconName, styles) => {
      // Clean up styles and set appropriate color
      let cleanStyles = styles
        .replace(/color:\s*[^;]+/g, "")
        .replace(/stroke:\s*[^;]+/g, "");
      cleanStyles = cleanStyles.replace(/;;/g, ";").replace(/;\s*;/g, ";");
      if (!cleanStyles.includes("width:")) {cleanStyles = "width: 20px; height: 20px; " + cleanStyles;}
      cleanStyles +=
        " color: var(--icon-color-muted); stroke: var(--icon-color-muted);";
      return match.replace(/style="[^"]*"/, `style="${cleanStyles.trim()}"`);
    },
  );

  // Search icon
  updated = updated.replace(
    /<span class="search-icon">\s*<i data-lucide="([^"]+)"[^>]*style="([^"]*)"/g,
    (match, iconName, styles) => {
      let cleanStyles = styles
        .replace(/color:\s*[^;]+/g, "")
        .replace(/stroke:\s*[^;]+/g, "");
      cleanStyles = cleanStyles.replace(/;;/g, ";").replace(/;\s*;/g, ";");
      if (!cleanStyles.includes("width:")) {cleanStyles = "width: 16px; height: 16px; " + cleanStyles;}
      cleanStyles +=
        " color: var(--icon-color-muted); stroke: var(--icon-color-muted);";
      return match.replace(/style="[^"]*"/, `style="${cleanStyles.trim()}"`);
    },
  );

  // Header icons
  updated = updated.replace(
    /<div class="header-icon"[^>]*>\s*<i data-lucide="([^"]+)"[^>]*style="([^"]*)"/g,
    (match, iconName, styles) => {
      let cleanStyles = styles
        .replace(/color:\s*[^;]+/g, "")
        .replace(/stroke:\s*[^;]+/g, "");
      cleanStyles = cleanStyles.replace(/;;/g, ";").replace(/;\s*;/g, ";");
      if (!cleanStyles.includes("width:")) {cleanStyles = "width: 18px; height: 18px; " + cleanStyles;}
      cleanStyles +=
        " color: var(--icon-color-secondary); stroke: var(--icon-color-secondary);";
      return match.replace(/style="[^"]*"/, `style="${cleanStyles.trim()}"`);
    },
  );

  // General icons - default to white
  updated = updated.replace(
    /<i data-lucide="([^"]+)"([^>]*)>/g,
    (match, iconName, attrs) => {
      if (attrs.includes("style=")) {
        let styles = attrs.match(/style="([^"]*)"/)[1];
        // Remove duplicate color/stroke
        styles = styles
          .replace(/color:\s*[^;]+/g, "")
          .replace(/stroke:\s*[^;]+/g, "");
        styles = styles.replace(/;;/g, ";").replace(/;\s*;/g, ";");
        // Only add default white if not in sidebar/header/search (those have specific colors)
        if (
          !attrs.includes("sidebar-icon") &&
          !attrs.includes("header-icon") &&
          !attrs.includes("search-icon")
        ) {
          if (!styles.includes("color:")) {
            styles +=
              " color: var(--icon-color-primary); stroke: var(--icon-color-primary);";
          }
        }
        attrs = attrs.replace(/style="[^"]*"/, `style="${styles.trim()}"`);
      } else {
        // Only add default if not in specific contexts
        if (
          !attrs.includes("sidebar-icon") &&
          !attrs.includes("header-icon") &&
          !attrs.includes("search-icon")
        ) {
          attrs +=
            ' style="color: var(--icon-color-primary); stroke: var(--icon-color-primary);"';
        }
      }
      return `<i data-lucide="${iconName}"${attrs}>`;
    },
  );

  return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`Fixing icon styles in ${htmlFiles.length} HTML files...\n`);

htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = fixIconStyles(content);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(
        `✅ Fixed: ${path.relative(path.join(__dirname, ".."), file)}`,
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${file}:`, error.message);
  }
});

console.log("\n✨ Icon style fix complete!");
