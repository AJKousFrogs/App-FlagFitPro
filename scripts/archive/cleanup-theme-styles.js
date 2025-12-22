 
// Script to clean up old styles and ensure consistent dark theme
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

function cleanupStyles(htmlContent) {
  let updated = htmlContent;

  // Remove old sidebar width styles (280px -> should be 64px from dark-theme.css)
  updated = updated.replace(/\.sidebar\s*\{[^}]*width:\s*280px;[^}]*\}/gs, "");
  updated = updated.replace(/\.sidebar\s*\{[^}]*width:\s*280px[^}]*\}/gs, "");

  // Remove old sidebar background styles (will use dark-theme.css)
  updated = updated.replace(
    /\.sidebar\s*\{[^}]*background:\s*var\(--white\);[^}]*\}/gs,
    "",
  );
  updated = updated.replace(
    /\.sidebar\s*\{[^}]*background:\s*var\(--dark-card-bg\);[^}]*\}/gs,
    "",
  );

  // Remove old sidebar-header, sidebar-brand, nav-section styles (hidden in dark-theme.css)
  updated = updated.replace(/\.sidebar-header\s*\{[^}]*\}/gs, "");
  updated = updated.replace(/\.sidebar-brand\s*\{[^}]*\}/gs, "");
  updated = updated.replace(/\.nav-section\s*\{[^}]*\}/gs, "");
  updated = updated.replace(/\.nav-section-title\s*\{[^}]*\}/gs, "");

  // Update old nav-item styles to be minimal (dark-theme.css handles it)
  updated = updated.replace(
    /\.nav-item\s*\{[^}]*display:\s*flex;[^}]*\}/gs,
    "",
  );
  updated = updated.replace(/\.nav-item:hover\s*\{[^}]*\}/gs, "");
  updated = updated.replace(/\.nav-item\.active\s*\{[^}]*\}/gs, "");

  // Remove duplicate sidebar comments
  updated = updated.replace(
    /<!-- Sidebar -->\s*<!-- Sidebar - Icon Only -->/g,
    "<!-- Sidebar - Icon Only -->",
  );

  // Ensure top-bar uses fixed position (from dark-theme.css)
  updated = updated.replace(
    /\.top-bar\s*\{[^}]*display:\s*flex;[^}]*margin-bottom:[^}]*\}/gs,
    "",
  );

  // Remove old welcome-section styles if top-bar is fixed
  if (updated.includes("top-bar") && updated.includes("header-left")) {
    updated = updated.replace(/\.welcome-section[^{]*\{[^}]*\}/gs, "");
  }

  // Clean up empty style blocks
  updated = updated.replace(/<style>\s*<\/style>/g, "");
  updated = updated.replace(/<style>\s*\/\*[^*]*\*\/\s*<\/style>/g, "");

  return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`Cleaning up ${htmlFiles.length} HTML files...\n`);

htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = cleanupStyles(content);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(
        `✅ Cleaned: ${path.relative(path.join(__dirname, ".."), file)}`,
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${file}:`, error.message);
  }
});

console.log("\n✨ Cleanup complete!");
