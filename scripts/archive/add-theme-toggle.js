 
// Script to add theme toggle switch to all HTML pages
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

function addThemeToggle(htmlContent) {
  let updated = htmlContent;

  // 1. Add theme-switcher.js script if not present
  if (!updated.includes("theme-switcher.js")) {
    // Add after icon-helper.js or before closing head
    if (updated.includes("icon-helper.js")) {
      updated = updated.replace(
        /(<script src="\.\/src\/icon-helper\.js"><\/script>)/,
        '$1\n    <script src="./src/theme-switcher.js"></script>',
      );
    } else if (updated.includes("</head>")) {
      updated = updated.replace(
        /(<\/head>)/,
        '    <script src="./src/theme-switcher.js"></script>\n$1',
      );
    }
  }

  // 2. Add light-theme.css link if not present (disabled by default)
  if (!updated.includes("light-theme.css")) {
    if (updated.includes("dark-theme.css")) {
      updated = updated.replace(
        /(<link rel="stylesheet" href="\.\/src\/dark-theme\.css">)/,
        '$1\n    <link rel="stylesheet" href="./src/light-theme.css" id="light-theme" disabled>',
      );
    }
  }

  // 3. Add theme toggle to header-right if it exists
  if (
    updated.includes("header-right") &&
    !updated.includes("theme-toggle-container")
  ) {
    // Find header-right and add toggle before user-menu
    updated = updated.replace(
      /(<div class="header-right">[\s\S]*?)(<div class="user-menu">)/,
      `$1
                    <div class="theme-toggle-container">
                        <label class="theme-toggle-label">
                            <input type="checkbox" id="theme-toggle" class="theme-toggle-input" checked>
                            <span class="theme-toggle-slider"></span>
                            <span class="theme-toggle-text">Dark</span>
                        </label>
                    </div>
                    $2`,
    );
  }

  return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`Adding theme toggle to ${htmlFiles.length} HTML files...\n`);

htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = addThemeToggle(content);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(
        `✅ Added toggle: ${path.relative(path.join(__dirname, ".."), file)}`,
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${file}:`, error.message);
  }
});

console.log("\n✨ Theme toggle addition complete!");
