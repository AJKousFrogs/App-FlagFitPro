#!/usr/bin/env node
/**
 * Design System Validation Script
 * Checks HTML files for design system compliance
 */

const fs = require("fs");
const path = require("path");

const violations = {
  hardcodedColors: [],
  hardcodedSpacing: [],
  customFonts: [],
  missingSidebar: [],
  missingMainContent: [],
  missingCSSFiles: [],
  newCardClasses: [],
};

const requiredCSSFiles = [
  "comprehensive-design-system.css",
  "spacing-system.css",
  "modern-dashboard-redesign.css",
  "hover-effects.css",
];

const _requiredScripts = [
  "lucide@latest",
  "icon-helper.js",
  "theme-switcher.js",
  "nav-highlight.js",
];

// Patterns to check
const hardcodedColorPattern = /#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/gi;
const hardcodedSpacingPattern =
  /(padding|margin|gap|top|bottom|left|right):\s*\d+px/gi;
const customFontPattern =
  /font-family:\s*[^'"]*['"](?!Inter|Roboto)[^'"]*['"]/gi;
const _newCardClassPattern = /class=["'][^"']*card[^"']*["']/gi;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath);
  const issues = [];

  // Skip public pages
  if (["login.html", "register.html", "index.html"].includes(fileName)) {
    return { fileName, issues: [] };
  }

  // Check for required CSS files
  requiredCSSFiles.forEach((cssFile) => {
    if (!content.includes(cssFile)) {
      issues.push(`Missing CSS file: ${cssFile}`);
      violations.missingCSSFiles.push({ file: fileName, missing: cssFile });
    }
  });

  // Check for sidebar
  if (!content.includes('class="sidebar"') && fileName !== "workout.html") {
    issues.push("Missing sidebar");
    violations.missingSidebar.push(fileName);
  }

  // Check for main-content
  if (
    !content.includes('class="main-content"') &&
    fileName !== "workout.html"
  ) {
    issues.push("Missing main-content");
    violations.missingMainContent.push(fileName);
  }

  // Check for dashboard-container
  if (
    !content.includes('class="dashboard-container"') &&
    fileName !== "workout.html"
  ) {
    issues.push("Missing dashboard-container");
  }

  // Check for hardcoded colors (in style tags and inline styles)
  const styleMatches = content.match(/<style>[\s\S]*?<\/style>/gi) || [];
  styleMatches.forEach((styleBlock) => {
    const colorMatches = styleBlock.match(hardcodedColorPattern);
    if (colorMatches) {
      colorMatches.forEach((match) => {
        // Allow rgba/rgb in shadows/gradients if using variables
        if (
          !match.includes("var(") &&
          !match.match(/rgba?\(0,\s*0,\s*0,\s*0\.\d+\)/)
        ) {
          issues.push(`Hardcoded color: ${match}`);
          violations.hardcodedColors.push({ file: fileName, color: match });
        }
      });
    }
  });

  // Check for hardcoded spacing in style tags
  styleMatches.forEach((styleBlock) => {
    const spacingMatches = styleBlock.match(hardcodedSpacingPattern);
    if (spacingMatches) {
      spacingMatches.forEach((match) => {
        if (!match.includes("var(")) {
          issues.push(`Hardcoded spacing: ${match}`);
          violations.hardcodedSpacing.push({ file: fileName, spacing: match });
        }
      });
    }
  });

  // Check for custom fonts
  const fontMatches = content.match(customFontPattern);
  if (fontMatches) {
    issues.push(`Custom font detected`);
    violations.customFonts.push({ file: fileName, fonts: fontMatches });
  }

  return { fileName, issues };
}

// Get all HTML files
const htmlFiles = fs
  .readdirSync(path.join(__dirname, ".."))
  .filter((file) => file.endsWith(".html"))
  .filter((file) => !file.includes("test") && !file.includes("example"));

console.log("🔍 Validating Design System Compliance...\n");

htmlFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  const result = checkFile(filePath);

  if (result.issues.length > 0) {
    console.log(`❌ ${file}:`);
    result.issues.forEach((issue) => console.log(`   - ${issue}`));
  } else {
    console.log(`✅ ${file}`);
  }
});

console.log("\n📊 SUMMARY:\n");
console.log(`Hardcoded Colors: ${violations.hardcodedColors.length}`);
console.log(`Hardcoded Spacing: ${violations.hardcodedSpacing.length}`);
console.log(`Custom Fonts: ${violations.customFonts.length}`);
console.log(`Missing Sidebar: ${violations.missingSidebar.length}`);
console.log(`Missing Main Content: ${violations.missingMainContent.length}`);
console.log(`Missing CSS Files: ${violations.missingCSSFiles.length}`);

// Write report
const report = {
  timestamp: new Date().toISOString(),
  violations,
  totalFiles: htmlFiles.length,
};

fs.writeFileSync(
  path.join(__dirname, "..", "DESIGN_SYSTEM_VALIDATION_REPORT.json"),
  JSON.stringify(report, null, 2),
);

console.log(
  "\n✅ Validation complete! Report saved to DESIGN_SYSTEM_VALIDATION_REPORT.json",
);
