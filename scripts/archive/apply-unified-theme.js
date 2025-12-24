// Script to apply unified dark theme design system to all HTML files
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get all HTML files
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

// Update HTML file with unified theme
function applyUnifiedTheme(htmlContent, filePath) {
  let updated = htmlContent;
  const fileName = path.basename(filePath);

  // Skip login, register, reset-password - they have their own styling
  if (
    [
      "login.html",
      "register.html",
      "reset-password.html",
      "index.html",
    ].includes(fileName)
  ) {
    return updated;
  }

  // 1. Add dark-theme.css if not present
  if (!updated.includes("dark-theme.css")) {
    updated = updated.replace(
      /(<link rel="stylesheet" href="\.\/src\/hover-effects\.css">)/,
      '$1\n    <link rel="stylesheet" href="./src/dark-theme.css">',
    );
  }

  // 2. Update dashboard-container background
  updated = updated.replace(
    /background:\s*var\(--bg-secondary\);/g,
    "background: var(--dark-bg-primary);",
  );
  updated = updated.replace(
    /background:\s*#f8fafc;/g,
    "background: var(--dark-bg-primary);",
  );

  // 3. Replace old sidebar structure with icon-only sidebar
  const newSidebar = `        <!-- Sidebar - Icon Only -->
        <div class="sidebar">
            <div class="sidebar-logo" onclick="window.location.href='/dashboard.html'" title="FlagFit Pro">
                <i data-lucide="activity" style="width: 20px; height: 20px;"></i>
            </div>
            <a href="/dashboard.html" class="sidebar-icon ${fileName === "dashboard.html" ? "active" : ""}" title="Dashboard">
                <i data-lucide="layout-dashboard" style="width: 20px; height: 20px;"></i>
            </a>
            <a href="/roster.html" class="sidebar-icon ${fileName === "roster.html" ? "active" : ""}" title="Team Roster">
                <i data-lucide="users" style="width: 20px; height: 20px;"></i>
            </a>
            <a href="/training.html" class="sidebar-icon ${fileName === "training.html" ? "active" : ""}" title="Training">
                <i data-lucide="zap" style="width: 20px; height: 20px;"></i>
            </a>
            <a href="/tournaments.html" class="sidebar-icon ${fileName === "tournaments.html" ? "active" : ""}" title="Tournaments">
                <i data-lucide="trophy" style="width: 20px; height: 20px;"></i>
            </a>
            <a href="/analytics.html" class="sidebar-icon ${fileName === "analytics.html" ? "active" : ""}" title="Analytics">
                <i data-lucide="bar-chart-3" style="width: 20px; height: 20px;"></i>
            </a>
            <a href="/community.html" class="sidebar-icon ${fileName === "community.html" ? "active" : ""}" title="Community">
                <i data-lucide="message-circle" style="width: 20px; height: 20px;"></i>
            </a>
            <a href="/settings.html" class="sidebar-icon ${fileName === "settings.html" ? "active" : ""}" title="Settings">
                <i data-lucide="settings" style="width: 20px; height: 20px;"></i>
            </a>
        </div>`;

  // Only replace if old sidebar structure exists
  if (updated.includes("sidebar-header") || updated.includes("nav-section")) {
    // Find and replace the sidebar section
    const sidebarMatch = updated.match(
      /<div class="sidebar">[\s\S]*?(?=<main|<div class="main-content"|<\/body>)/,
    );
    if (sidebarMatch) {
      updated = updated.replace(sidebarMatch[0], newSidebar + "\n\n        ");
    }
  }

  // 4. Add top header if not present (before main-content)
  if (!updated.includes("top-bar") && updated.includes("main-content")) {
    const topHeader = `            <!-- Top Bar -->
            <div class="top-bar">
                <div class="header-left">
                    <div class="search-box">
                        <span class="search-icon"><i data-lucide="search" style="width: 16px; height: 16px;"></i></span>
                        <input type="text" id="global-search" class="search-input" placeholder="Search for players, teams & more" oninput="if(typeof performGlobalSearch === 'function') performGlobalSearch(this.value)">
                        <div id="search-results" class="search-results" style="display: none;"></div>
                    </div>
                </div>
                
                <div class="header-right">
                    <div style="position: relative;">
                        <div id="notification-bell" class="header-icon" onclick="if(typeof toggleNotifications === 'function') toggleNotifications()">
                            <i data-lucide="bell" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div id="notification-badge" style="position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; border: 2px solid var(--dark-bg-secondary); display: none;">3</div>
                    </div>
                    <div class="header-icon">
                        <i data-lucide="settings" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div class="user-menu">
                        <div class="user-avatar" id="user-avatar">U</div>
                    </div>
                </div>
            </div>

`;

    updated = updated.replace(
      /(<main class="main-content">)/,
      topHeader + "$1",
    );
  }

  // 5. Update main-content margin and padding
  updated = updated.replace(
    /\.main-content\s*\{[^}]*margin-left:\s*\d+px;[^}]*\}/g,
    ".main-content {\n            margin-left: 64px;\n            margin-top: 70px;\n            flex: 1;\n            padding: 32px;\n            background: var(--dark-bg-primary);\n        }",
  );

  // 6. Update card backgrounds to dark theme
  updated = updated.replace(
    /background:\s*var\(--white\);/g,
    "background: var(--dark-card-bg);",
  );
  updated = updated.replace(
    /background:\s*#ffffff;/g,
    "background: var(--dark-card-bg);",
  );

  // 7. Update text colors
  updated = updated.replace(
    /color:\s*var\(--gray-900\);/g,
    "color: var(--dark-text-primary);",
  );
  updated = updated.replace(
    /color:\s*var\(--gray-600\);/g,
    "color: var(--dark-text-secondary);",
  );
  updated = updated.replace(
    /color:\s*var\(--gray-500\);/g,
    "color: var(--dark-text-muted);",
  );

  // 8. Update border colors
  updated = updated.replace(
    /border.*var\(--border-light\)/g,
    "border: 1px solid var(--dark-border)",
  );

  // 9. Add icon initialization if DOMContentLoaded exists
  if (
    updated.includes("DOMContentLoaded") &&
    !updated.includes("lucide.createIcons")
  ) {
    updated = updated.replace(
      /(document\.addEventListener\('DOMContentLoaded',\s*(?:async\s+)?function\(\)\s*\{)/,
      `$1\n            // Initialize Lucide icons\n            if (typeof lucide !== 'undefined') {\n                lucide.createIcons();\n            }`,
    );
  }

  return updated;
}

// Main execution
const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`Found ${htmlFiles.length} HTML files to process...\n`);

htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = applyUnifiedTheme(content, file);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(
        `✅ Updated: ${path.relative(path.join(__dirname, ".."), file)}`,
      );
    } else {
      console.log(
        `⏭️  Skipped: ${path.relative(path.join(__dirname, ".."), file)} (no changes needed)`,
      );
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log("\n✨ Unified theme application complete!");
