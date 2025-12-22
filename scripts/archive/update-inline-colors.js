 
// Script to update inline color styles to dark theme
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

function updateInlineColors(htmlContent) {
  let updated = htmlContent;

  // Update common dark text colors
  updated = updated.replace(
    /color:\s*#333[^;]*;/g,
    "color: var(--dark-text-primary);",
  );
  updated = updated.replace(
    /color:\s*#666[^;]*;/g,
    "color: var(--dark-text-secondary);",
  );
  updated = updated.replace(
    /color:\s*#999[^;]*;/g,
    "color: var(--dark-text-muted);",
  );
  updated = updated.replace(
    /color:\s*#000[^;]*;/g,
    "color: var(--dark-text-primary);",
  );

  // Update background colors
  updated = updated.replace(
    /background:\s*#f8fafc[^;]*;/g,
    "background: var(--dark-bg-primary);",
  );
  updated = updated.replace(
    /background:\s*#ffffff[^;]*;/g,
    "background: var(--dark-card-bg);",
  );
  updated = updated.replace(
    /background:\s*#fff[^;]*;/g,
    "background: var(--dark-card-bg);",
  );

  // Update border colors
  updated = updated.replace(
    /border.*#e5e7eb[^;]*;/g,
    "border: 1px solid var(--dark-border);",
  );
  updated = updated.replace(
    /border.*#d1d5db[^;]*;/g,
    "border: 1px solid var(--dark-border);",
  );

  return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`Updating inline colors in ${htmlFiles.length} HTML files...\n`);

htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = updateInlineColors(content);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(
        `✅ Updated colors: ${path.relative(path.join(__dirname, ".."), file)}`,
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${file}:`, error.message);
  }
});

console.log("\n✨ Color update complete!");
