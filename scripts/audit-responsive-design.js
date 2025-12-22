/* eslint-disable no-console */
// Comprehensive Responsive Design Audit Script
// Checks all HTML and CSS files for responsive design implementation

import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Common device breakpoints
const deviceBreakpoints = {
  // Phones
  "iPhone SE": { width: 375, height: 667 },
  "iPhone 12/13/14": { width: 390, height: 844 },
  "iPhone 12/13/14 Pro Max": { width: 428, height: 926 },
  "Samsung Galaxy S21": { width: 360, height: 800 },
  "Samsung Galaxy S21 Ultra": { width: 412, height: 915 },
  "Google Pixel 5": { width: 393, height: 851 },

  // Tablets
  "iPad Mini": { width: 768, height: 1024 },
  "iPad Air/Pro": { width: 820, height: 1180 },
  'iPad Pro 12.9"': { width: 1024, height: 1366 },
  "Samsung Galaxy Tab": { width: 800, height: 1280 },

  // Small devices
  "iPhone 5/SE (old)": { width: 320, height: 568 },
  "Small Android": { width: 360, height: 640 },
};

// Required breakpoints for coverage
const requiredBreakpoints = [
  { name: "Mobile Small", max: 480 },
  { name: "Mobile Medium", max: 768 },
  { name: "Tablet", max: 1024 },
  { name: "Desktop", min: 1025 },
];

function getAllFiles(dir, extension) {
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
      results = results.concat(getAllFiles(filePath, extension));
    } else if (
      file.endsWith(extension) &&
      !file.includes("design-system-example")
    ) {
      results.push(filePath);
    }
  });

  return results;
}

function checkViewportMeta(htmlContent, _filePath) {
  const hasViewport =
    htmlContent.includes("viewport") ||
    htmlContent.includes('meta name="viewport"');
  const viewportPattern = /<meta[^>]*viewport[^>]*>/i;
  const match = htmlContent.match(viewportPattern);

  const issues = [];
  if (!hasViewport) {
    issues.push("Missing viewport meta tag");
  } else if (match) {
    const viewport = match[0];
    if (!viewport.includes("width=device-width")) {
      issues.push("Viewport missing width=device-width");
    }
    if (!viewport.includes("initial-scale=1.0")) {
      issues.push("Viewport missing initial-scale=1.0");
    }
    if (viewport.includes("user-scalable=no")) {
      issues.push("Viewport has user-scalable=no (accessibility issue)");
    }
  }

  return { hasViewport, issues, viewport: match ? match[0] : null };
}

function checkMediaQueries(cssContent) {
  const mediaQueryPattern = /@media\s*\([^)]+\)\s*\{/g;
  const matches = cssContent.match(mediaQueryPattern) || [];

  const breakpoints = {
    mobile: [],
    tablet: [],
    desktop: [],
    other: [],
  };

  matches.forEach((match) => {
    if (match.includes("max-width: 480") || match.includes("max-width: 479")) {
      breakpoints.mobile.push(match);
    } else if (
      match.includes("max-width: 768") ||
      match.includes("max-width: 767")
    ) {
      breakpoints.mobile.push(match);
    } else if (
      match.includes("max-width: 1024") ||
      match.includes("max-width: 1023")
    ) {
      breakpoints.tablet.push(match);
    } else if (
      match.includes("min-width: 1025") ||
      match.includes("min-width: 1024")
    ) {
      breakpoints.desktop.push(match);
    } else {
      breakpoints.other.push(match);
    }
  });

  return { total: matches.length, breakpoints };
}

function checkTouchTargets(htmlContent, cssContent) {
  const issues = [];

  // Check for buttons with small sizes
  const smallButtonPattern = /(?:button|\.btn)[^}]*height:\s*([0-9]+)px/gi;
  const buttonMatches = cssContent.match(smallButtonPattern) || [];

  buttonMatches.forEach((match) => {
    const heightMatch = match.match(/([0-9]+)px/);
    if (heightMatch) {
      const height = parseInt(heightMatch[1]);
      if (height < 44) {
        issues.push(
          `Button height ${height}px is below 44px minimum touch target`,
        );
      }
    }
  });

  // Check for small clickable areas
  // Note: Small clickable areas are checked via button height above

  return issues;
}

function checkFontSizes(cssContent) {
  const issues = [];

  // Check for very small font sizes on mobile
  const smallFontPattern = /font-size:\s*([0-9.]+)(px|rem)/gi;
  const fontMatches = cssContent.match(smallFontPattern) || [];

  fontMatches.forEach((match) => {
    const sizeMatch = match.match(/([0-9.]+)(px|rem)/);
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2];
      let sizeInPx = size;
      if (unit === "rem") {
        sizeInPx = size * 16; // Assuming 16px base
      }
      if (sizeInPx < 12) {
        issues.push(`Font size ${match} is below 12px minimum`);
      }
    }
  });

  return issues;
}

function checkSidebarMobile(cssContent) {
  const issues = [];

  // Check if sidebar has mobile handling
  const hasMobileSidebar =
    cssContent.includes("sidebar") &&
    (cssContent.includes("@media") ||
      cssContent.includes("transform: translateX"));

  if (!hasMobileSidebar) {
    issues.push("Sidebar may not be properly hidden/transformed on mobile");
  }

  return issues;
}

function checkFormsMobile(cssContent) {
  const issues = [];

  // Check if inputs have mobile-friendly styles
  const hasFontSize =
    cssContent.includes("font-size: 16px") ||
    cssContent.includes("font-size: 1rem");

  if (!hasFontSize) {
    issues.push("Inputs may not have 16px font-size (prevents zoom on iOS)");
  }

  return issues;
}

function auditFile(filePath, isHTML) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  const audit = {
    file: relativePath,
    type: isHTML ? "HTML" : "CSS",
    issues: [],
    warnings: [],
    stats: {},
  };

  if (isHTML) {
    const viewport = checkViewportMeta(content, filePath);
    audit.stats.viewport = viewport;
    audit.issues.push(...viewport.issues);

    // Check for responsive images
    if (
      content.includes("<img") &&
      !content.includes("srcset") &&
      !content.includes("sizes")
    ) {
      audit.warnings.push(
        "Images may not be responsive (missing srcset/sizes)",
      );
    }

    // Check for fixed widths
    if (
      content.includes("width:") &&
      content.includes("px") &&
      !content.includes("max-width")
    ) {
      audit.warnings.push(
        "May contain fixed widths (check for responsive issues)",
      );
    }
  } else {
    const mediaQueries = checkMediaQueries(content);
    audit.stats.mediaQueries = mediaQueries;

    if (mediaQueries.total === 0) {
      audit.issues.push("No media queries found");
    }

    if (mediaQueries.breakpoints.mobile.length === 0) {
      audit.issues.push("No mobile breakpoints (max-width: 768px)");
    }

    if (mediaQueries.breakpoints.tablet.length === 0) {
      audit.warnings.push("No tablet breakpoints (max-width: 1024px)");
    }

    const touchIssues = checkTouchTargets("", content);
    audit.issues.push(...touchIssues);

    const fontIssues = checkFontSizes(content);
    audit.warnings.push(...fontIssues);

    const sidebarIssues = checkSidebarMobile(content);
    audit.warnings.push(...sidebarIssues);

    const formIssues = checkFormsMobile(content);
    audit.issues.push(...formIssues);
  }

  return audit;
}

// Main audit
const htmlFiles = getAllFiles(path.join(__dirname, ".."), ".html");
const cssFiles = getAllFiles(path.join(__dirname, ".."), ".css");

console.log(`\n📱 RESPONSIVE DESIGN AUDIT\n`);
console.log(
  `Scanning ${htmlFiles.length} HTML files and ${cssFiles.length} CSS files...\n`,
);

const results = {
  html: [],
  css: [],
  summary: {
    totalFiles: htmlFiles.length + cssFiles.length,
    filesWithIssues: 0,
    filesWithWarnings: 0,
    totalIssues: 0,
    totalWarnings: 0,
  },
};

// Audit HTML files
htmlFiles.forEach((file) => {
  const audit = auditFile(file, true);
  results.html.push(audit);

  if (audit.issues.length > 0) {
    results.summary.filesWithIssues++;
    results.summary.totalIssues += audit.issues.length;
  }
  if (audit.warnings.length > 0) {
    results.summary.filesWithWarnings++;
    results.summary.totalWarnings += audit.warnings.length;
  }
});

// Audit CSS files
cssFiles.forEach((file) => {
  const audit = auditFile(file, false);
  results.css.push(audit);

  if (audit.issues.length > 0) {
    results.summary.filesWithIssues++;
    results.summary.totalIssues += audit.issues.length;
  }
  if (audit.warnings.length > 0) {
    results.summary.filesWithWarnings++;
    results.summary.totalWarnings += audit.warnings.length;
  }
});

// Print summary
console.log("=".repeat(80));
console.log("RESPONSIVE DESIGN AUDIT SUMMARY");
console.log("=".repeat(80));
console.log(`Total Files: ${results.summary.totalFiles}`);
console.log(`HTML Files: ${htmlFiles.length}`);
console.log(`CSS Files: ${cssFiles.length}`);
console.log(`Files with Issues: ${results.summary.filesWithIssues}`);
console.log(`Files with Warnings: ${results.summary.filesWithWarnings}`);
console.log(`Total Issues: ${results.summary.totalIssues}`);
console.log(`Total Warnings: ${results.summary.totalWarnings}`);
console.log("=".repeat(80));
console.log("\n");

// Print detailed results
console.log("📄 HTML FILES:\n");
results.html.forEach((audit) => {
  if (audit.issues.length > 0 || audit.warnings.length > 0) {
    console.log(`\n${audit.file}`);
    if (audit.issues.length > 0) {
      console.log(`   ❌ Issues (${audit.issues.length}):`);
      audit.issues.forEach((issue) => console.log(`      - ${issue}`));
    }
    if (audit.warnings.length > 0) {
      console.log(`   ⚠️  Warnings (${audit.warnings.length}):`);
      audit.warnings.forEach((warning) => console.log(`      - ${warning}`));
    }
  }
});

console.log("\n\n🎨 CSS FILES:\n");
results.css.forEach((audit) => {
  if (
    audit.issues.length > 0 ||
    audit.warnings.length > 0 ||
    audit.stats.mediaQueries
  ) {
    console.log(`\n${audit.file}`);
    if (audit.stats.mediaQueries) {
      console.log(
        `   📊 Media Queries: ${audit.stats.mediaQueries.total} total`,
      );
      console.log(
        `      - Mobile: ${audit.stats.mediaQueries.breakpoints.mobile.length}`,
      );
      console.log(
        `      - Tablet: ${audit.stats.mediaQueries.breakpoints.tablet.length}`,
      );
      console.log(
        `      - Desktop: ${audit.stats.mediaQueries.breakpoints.desktop.length}`,
      );
    }
    if (audit.issues.length > 0) {
      console.log(`   ❌ Issues (${audit.issues.length}):`);
      audit.issues.forEach((issue) => console.log(`      - ${issue}`));
    }
    if (audit.warnings.length > 0) {
      console.log(`   ⚠️  Warnings (${audit.warnings.length}):`);
      audit.warnings.forEach((warning) => console.log(`      - ${warning}`));
    }
  }
});

// Generate report
const reportPath = path.join(
  __dirname,
  "..",
  "RESPONSIVE_DESIGN_AUDIT_REPORT.md",
);
const reportContent = `# Responsive Design Audit Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Files Audited**: ${results.summary.totalFiles}
- **HTML Files**: ${htmlFiles.length}
- **CSS Files**: ${cssFiles.length}
- **Files with Issues**: ${results.summary.filesWithIssues}
- **Files with Warnings**: ${results.summary.filesWithWarnings}
- **Total Issues**: ${results.summary.totalIssues}
- **Total Warnings**: ${results.summary.totalWarnings}

## Device Coverage

### Supported Breakpoints
${requiredBreakpoints.map((bp) => `- **${bp.name}**: ${bp.max ? `max-width: ${bp.max}px` : `min-width: ${bp.min}px`}`).join("\n")}

### Common Devices
${Object.entries(deviceBreakpoints)
  .map(([device, size]) => `- **${device}**: ${size.width}×${size.height}px`)
  .join("\n")}

## Detailed Results

### HTML Files
${results.html
  .map((audit) => {
    if (audit.issues.length === 0 && audit.warnings.length === 0) {
      return `### ✅ ${audit.file}\n- No issues found\n`;
    }

    let content = `### ${audit.issues.length > 0 ? "❌" : "⚠️"} ${audit.file}\n`;

    if (audit.stats.viewport) {
      content += `- **Viewport**: ${audit.stats.viewport.hasViewport ? "✅ Present" : "❌ Missing"}\n`;
      if (audit.stats.viewport.viewport) {
        content += `  - Content: \`${audit.stats.viewport.viewport}\`\n`;
      }
    }

    if (audit.issues.length > 0) {
      content += `\n**Issues (${audit.issues.length}):**\n`;
      audit.issues.forEach((issue) => (content += `- ${issue}\n`));
    }

    if (audit.warnings.length > 0) {
      content += `\n**Warnings (${audit.warnings.length}):**\n`;
      audit.warnings.forEach((warning) => (content += `- ${warning}\n`));
    }

    return content + "\n";
  })
  .join("\n")}

### CSS Files
${results.css
  .map((audit) => {
    if (
      audit.issues.length === 0 &&
      audit.warnings.length === 0 &&
      (!audit.stats.mediaQueries || audit.stats.mediaQueries.total === 0)
    ) {
      return `### ✅ ${audit.file}\n- No issues found\n`;
    }

    let content = `### ${audit.issues.length > 0 ? "❌" : "⚠️"} ${audit.file}\n`;

    if (audit.stats.mediaQueries) {
      content += `- **Media Queries**: ${audit.stats.mediaQueries.total} total\n`;
      content += `  - Mobile: ${audit.stats.mediaQueries.breakpoints.mobile.length}\n`;
      content += `  - Tablet: ${audit.stats.mediaQueries.breakpoints.tablet.length}\n`;
      content += `  - Desktop: ${audit.stats.mediaQueries.breakpoints.desktop.length}\n`;
    }

    if (audit.issues.length > 0) {
      content += `\n**Issues (${audit.issues.length}):**\n`;
      audit.issues.forEach((issue) => (content += `- ${issue}\n`));
    }

    if (audit.warnings.length > 0) {
      content += `\n**Warnings (${audit.warnings.length}):**\n`;
      audit.warnings.forEach((warning) => (content += `- ${warning}\n`));
    }

    return content + "\n";
  })
  .join("\n")}
`;

fs.writeFileSync(reportPath, reportContent, "utf8");
console.log(`\n📊 Full report saved to: RESPONSIVE_DESIGN_AUDIT_REPORT.md\n`);
