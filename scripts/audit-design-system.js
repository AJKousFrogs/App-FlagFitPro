// Comprehensive Design System Audit Script
// Checks all HTML files for design system consistency

import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors that should NOT be used (non-green theme)
const forbiddenColors = {
  purple: [
    "#667eea",
    "#764ba2",
    "#8b5cf6",
    "#7c3aed",
    "#a78bfa",
    "#6366F1",
    "#4F46E5",
    "#4338CA",
  ],
  blue: ["#3b82f6", "#1e40af", "#0ea5e9", "#0284c7", "#0369a1", "#5271FF"],
  pink: ["#ec4899", "#fb7185", "#f43f5e", "#be185d", "#9d174d"],
  oldBlue: ["#1e3a8a", "#0c2d6b"],
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

function extractHexColors(content) {
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const matches = content.match(hexPattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}

function extractRgbaColors(content) {
  const rgbaPattern = /rgba?\([^)]+\)/g;
  const matches = content.match(rgbaPattern) || [];
  return [...new Set(matches)];
}

function checkForForbiddenColors(colors) {
  const issues = [];
  colors.forEach((color) => {
    const lowerColor = color.toLowerCase();
    Object.entries(forbiddenColors).forEach(([category, forbidden]) => {
      if (forbidden.some((fc) => lowerColor.includes(fc.toLowerCase()))) {
        issues.push({ color, category });
      }
    });
  });
  return issues;
}

function checkCSSLinks(content, filePath) {
  const issues = [];
  const hasDarkTheme = content.includes("dark-theme.css");

  // Check if it's a main app page (not login/register)
  const isMainPage =
    !filePath.includes("login") &&
    !filePath.includes("register") &&
    !filePath.includes("reset-password");

  if (isMainPage && !hasDarkTheme) {
    issues.push("Missing dark-theme.css");
  }

  return issues;
}

function checkForHardcodedColors(content) {
  const issues = [];
  // Check for inline style attributes with hex colors
  const inlineStylePattern = /style="[^"]*#[0-9a-fA-F]{3,6}[^"]*"/gi;
  const matches = content.match(inlineStylePattern) || [];

  if (matches.length > 0) {
    matches.forEach((match) => {
      // Check if it uses CSS variables
      if (!match.includes("var(--") && !match.includes("rgba(0,0,0")) {
        issues.push(
          `Hardcoded color in inline style: ${match.substring(0, 100)}`,
        );
      }
    });
  }

  return issues;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  const audit = {
    file: relativePath,
    issues: [],
    warnings: [],
    stats: {
      hexColors: 0,
      rgbaColors: 0,
      cssVariables: 0,
    },
  };

  // Extract colors
  const hexColors = extractHexColors(content);
  const rgbaColors = extractRgbaColors(content);

  audit.stats.hexColors = hexColors.length;
  audit.stats.rgbaColors = rgbaColors.length;
  audit.stats.cssVariables = (content.match(/var\(--[^)]+\)/g) || []).length;

  // Check for forbidden colors
  const forbiddenIssues = checkForForbiddenColors([
    ...hexColors,
    ...rgbaColors,
  ]);
  forbiddenIssues.forEach((issue) => {
    audit.issues.push(`Forbidden ${issue.category} color: ${issue.color}`);
  });

  // Check for hardcoded colors
  const hardcodedIssues = checkForHardcodedColors(content);
  audit.issues.push(...hardcodedIssues);

  // Check CSS links
  const cssIssues = checkCSSLinks(content, filePath);
  audit.warnings.push(...cssIssues);

  // Check for theme switcher
  if (
    !content.includes("theme-switcher.js") &&
    !filePath.includes("login") &&
    !filePath.includes("register") &&
    !filePath.includes("reset-password")
  ) {
    audit.warnings.push("Missing theme-switcher.js");
  }

  // Check for Lucide icons
  if (content.includes("data-lucide") && !content.includes("lucide@latest")) {
    audit.warnings.push("Using Lucide icons but missing CDN link");
  }

  return audit;
}

// Main audit function
const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));
console.log(`\n🔍 DESIGN SYSTEM AUDIT\n`);
console.log(`Scanning ${htmlFiles.length} HTML files...\n`);

const results = {
  totalFiles: htmlFiles.length,
  filesWithIssues: 0,
  filesWithWarnings: 0,
  totalIssues: 0,
  totalWarnings: 0,
  audits: [],
};

htmlFiles.forEach((file) => {
  const audit = auditFile(file);
  results.audits.push(audit);

  if (audit.issues.length > 0) {
    results.filesWithIssues++;
    results.totalIssues += audit.issues.length;
  }

  if (audit.warnings.length > 0) {
    results.filesWithWarnings++;
    results.totalWarnings += audit.warnings.length;
  }
});

// Print results
console.log("=".repeat(80));
console.log("AUDIT SUMMARY");
console.log("=".repeat(80));
console.log(`Total Files: ${results.totalFiles}`);
console.log(`Files with Issues: ${results.filesWithIssues}`);
console.log(`Files with Warnings: ${results.filesWithWarnings}`);
console.log(`Total Issues: ${results.totalIssues}`);
console.log(`Total Warnings: ${results.totalWarnings}`);
console.log("=".repeat(80));
console.log("\n");

// Print detailed results
results.audits.forEach((audit) => {
  if (audit.issues.length > 0 || audit.warnings.length > 0) {
    console.log(`\n📄 ${audit.file}`);
    console.log(
      `   Stats: ${audit.stats.hexColors} hex colors, ${audit.stats.rgbaColors} rgba colors, ${audit.stats.cssVariables} CSS variables`,
    );

    if (audit.issues.length > 0) {
      console.log(`   ❌ Issues (${audit.issues.length}):`);
      audit.issues.forEach((issue) => {
        console.log(`      - ${issue}`);
      });
    }

    if (audit.warnings.length > 0) {
      console.log(`   ⚠️  Warnings (${audit.warnings.length}):`);
      audit.warnings.forEach((warning) => {
        console.log(`      - ${warning}`);
      });
    }
  }
});

// Generate report file
const reportPath = path.join(__dirname, "..", "DESIGN_SYSTEM_AUDIT_REPORT.md");
const reportContent = `# Design System Audit Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Files Audited**: ${results.totalFiles}
- **Files with Issues**: ${results.filesWithIssues}
- **Files with Warnings**: ${results.filesWithWarnings}
- **Total Issues**: ${results.totalIssues}
- **Total Warnings**: ${results.totalWarnings}

## Detailed Results

${results.audits
  .map((audit) => {
    if (audit.issues.length === 0 && audit.warnings.length === 0) {
      return `### ✅ ${audit.file}\n- No issues found\n`;
    }

    let content = `### ${audit.issues.length > 0 ? "❌" : "⚠️"} ${audit.file}\n`;
    content += `- **Stats**: ${audit.stats.hexColors} hex colors, ${audit.stats.rgbaColors} rgba colors, ${audit.stats.cssVariables} CSS variables\n\n`;

    if (audit.issues.length > 0) {
      content += `**Issues (${audit.issues.length}):**\n`;
      audit.issues.forEach((issue) => {
        content += `- ${issue}\n`;
      });
      content += "\n";
    }

    if (audit.warnings.length > 0) {
      content += `**Warnings (${audit.warnings.length}):**\n`;
      audit.warnings.forEach((warning) => {
        content += `- ${warning}\n`;
      });
    }

    return content + "\n";
  })
  .join("\n")}
`;

fs.writeFileSync(reportPath, reportContent, "utf8");
console.log(`\n📊 Full report saved to: DESIGN_SYSTEM_AUDIT_REPORT.md\n`);
