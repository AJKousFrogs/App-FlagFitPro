// Comprehensive Responsive Page Testing Script
// Tests all HTML pages for responsive design issues

import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main pages to test (exclude templates, components, and test files)
const mainPages = [
  "index.html",
  "dashboard.html",
  "login.html",
  "register.html",
  "reset-password.html",
  "profile.html",
  "settings.html",
  "chat.html",
  "community.html",
  "roster.html",
  "analytics.html",
  "enhanced-analytics.html",
  "performance-tracking.html",
  "training.html",
  "training-schedule.html",
  "workout.html",
  "wellness.html",
  "tournaments.html",
  "game-tracker.html",
  "coach.html",
  "coach-dashboard.html",
  "qb-training-schedule.html",
  "qb-throwing-tracker.html",
  "qb-assessment-tools.html",
  "exercise-library.html",
  "component-library.html",
  "update-roster-data.html",
];

// Test breakpoints
const breakpoints = {
  mobileSmall: { name: "Mobile Small", width: 375, height: 667 },
  mobileMedium: { name: "Mobile Medium", width: 390, height: 844 },
  mobileLarge: { name: "Mobile Large", width: 428, height: 926 },
  tablet: { name: "Tablet", width: 768, height: 1024 },
  tabletLarge: { name: "Tablet Large", width: 1024, height: 1366 },
  desktop: { name: "Desktop", width: 1280, height: 720 },
  desktopLarge: { name: "Desktop Large", width: 1920, height: 1080 },
};

function checkPage(pagePath) {
  const fullPath = path.join(__dirname, "..", pagePath);

  if (!fs.existsSync(fullPath)) {
    return {
      page: pagePath,
      exists: false,
      issues: [`File not found: ${pagePath}`],
      warnings: [],
    };
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const issues = [];
  const warnings = [];
  const checks = {
    viewport: false,
    hasResponsiveCSS: false,
    hasFixedWidths: false,
    hasImages: false,
    hasForms: false,
    hasTables: false,
    hasModals: false,
  };

  // Check viewport meta tag
  const viewportPattern = /<meta[^>]*viewport[^>]*>/i;
  const viewportMatch = content.match(viewportPattern);
  if (viewportMatch) {
    checks.viewport = true;
    const viewport = viewportMatch[0];
    if (!viewport.includes("width=device-width")) {
      issues.push("Viewport missing width=device-width");
    }
    if (!viewport.includes("initial-scale=1.0")) {
      issues.push("Viewport missing initial-scale=1.0");
    }
    if (viewport.includes("user-scalable=no")) {
      warnings.push("Viewport has user-scalable=no (accessibility concern)");
    }
  } else {
    issues.push("Missing viewport meta tag");
  }

  // Check for responsive CSS imports
  if (
    content.includes("responsive-fixes.css") ||
    content.includes("main.css") ||
    content.includes("breakpoints.css")
  ) {
    checks.hasResponsiveCSS = true;
  } else {
    warnings.push("May not include responsive CSS files");
  }

  // Check for fixed widths in inline styles
  const fixedWidthPattern =
    /(?:width|min-width|max-width):\s*(\d+)px(?!\s*[;}]|\s*\/\*)/gi;
  const fixedWidthMatches = content.match(fixedWidthPattern);
  if (fixedWidthMatches) {
    checks.hasFixedWidths = true;
    const problematicWidths = fixedWidthMatches.filter((match) => {
      const widthMatch = match.match(/(\d+)px/);
      if (widthMatch) {
        const width = parseInt(widthMatch[1]);
        return width > 600; // Flag widths over 600px as potentially problematic
      }
      return false;
    });
    if (problematicWidths.length > 0) {
      warnings.push(
        `Found fixed widths that may cause issues: ${problematicWidths.join(", ")}`,
      );
    }
  }

  // Check for images
  if (content.includes("<img")) {
    checks.hasImages = true;
    if (!content.includes("srcset") && !content.includes("max-width: 100%")) {
      warnings.push(
        "Images may not be responsive (consider adding srcset or CSS max-width)",
      );
    }
  }

  // Check for forms
  if (content.includes("<form") || content.includes("<input")) {
    checks.hasForms = true;
    // Check if forms have proper mobile handling
    if (
      !content.includes("font-size: 16px") &&
      !content.includes("font-size: 1rem")
    ) {
      warnings.push("Forms may not have 16px font-size (iOS zoom prevention)");
    }
  }

  // Check for tables
  if (content.includes("<table")) {
    checks.hasTables = true;
    warnings.push("Tables present - verify horizontal scroll works on mobile");
  }

  // Check for modals
  if (
    content.includes("modal") ||
    content.includes("dialog") ||
    content.includes("popup")
  ) {
    checks.hasModals = true;
    warnings.push("Modals present - verify full-screen behavior on mobile");
  }

  // Check for common responsive issues
  if (
    content.includes("overflow-x: hidden") ||
    content.includes("overflow-x:hidden")
  ) {
    // Good - prevents horizontal scroll
  } else if (content.includes("overflow")) {
    warnings.push("Check overflow handling for mobile");
  }

  // Check for touch targets
  if (
    content.includes("min-height: 44px") ||
    content.includes("min-height:44px")
  ) {
    // Good - touch targets
  } else if (content.includes("button") || content.includes(".btn")) {
    warnings.push("Verify buttons have ≥44px touch targets on mobile");
  }

  return {
    page: pagePath,
    exists: true,
    checks,
    issues,
    warnings,
    score: calculateScore(issues, warnings),
  };
}

function calculateScore(issues, warnings) {
  const maxIssues = 10;
  const maxWarnings = 20;
  const issueScore = Math.max(0, 100 - (issues.length / maxIssues) * 50);
  const warningScore = Math.max(0, 50 - (warnings.length / maxWarnings) * 25);
  return Math.round(issueScore + warningScore);
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  const totalPages = results.length;
  const pagesWithIssues = results.filter((r) => r.issues.length > 0).length;
  const pagesWithWarnings = results.filter((r) => r.warnings.length > 0).length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / totalPages,
  );

  let report = `# Responsive Page Testing Report
Generated: ${timestamp}

## Summary

- **Total Pages Tested**: ${totalPages}
- **Pages with Issues**: ${pagesWithIssues}
- **Pages with Warnings**: ${pagesWithWarnings}
- **Total Issues**: ${totalIssues}
- **Total Warnings**: ${totalWarnings}
- **Average Score**: ${avgScore}/100

## Test Breakpoints

${Object.entries(breakpoints)
  .map(([_key, bp]) => `- **${bp.name}**: ${bp.width}×${bp.height}px`)
  .join("\n")}

## Page Results

`;

  // Sort by score (lowest first)
  const sortedResults = [...results].sort((a, b) => a.score - b.score);

  sortedResults.forEach((result) => {
    const status = result.exists
      ? result.issues.length === 0
        ? "✅"
        : result.issues.length <= 2
          ? "⚠️"
          : "❌"
      : "❌";

    report += `### ${status} ${result.page}\n\n`;
    report += `**Score**: ${result.score}/100\n\n`;

    if (!result.exists) {
      report += `- ❌ File not found\n\n`;
      return;
    }

    if (result.issues.length === 0 && result.warnings.length === 0) {
      report += `- ✅ No issues found\n\n`;
      return;
    }

    if (result.issues.length > 0) {
      report += `**Issues (${result.issues.length}):**\n`;
      result.issues.forEach((issue) => {
        report += `- ❌ ${issue}\n`;
      });
      report += `\n`;
    }

    if (result.warnings.length > 0) {
      report += `**Warnings (${result.warnings.length}):**\n`;
      result.warnings.forEach((warning) => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += `\n`;
    }

    report += `**Checks:**\n`;
    report += `- Viewport: ${result.checks.viewport ? "✅" : "❌"}\n`;
    report += `- Responsive CSS: ${result.checks.hasResponsiveCSS ? "✅" : "⚠️"}\n`;
    report += `- Fixed Widths: ${result.checks.hasFixedWidths ? "⚠️" : "✅"}\n`;
    report += `- Images: ${result.checks.hasImages ? "⚠️" : "✅"}\n`;
    report += `- Forms: ${result.checks.hasForms ? "⚠️" : "✅"}\n`;
    report += `- Tables: ${result.checks.hasTables ? "⚠️" : "✅"}\n`;
    report += `- Modals: ${result.checks.hasModals ? "⚠️" : "✅"}\n\n`;
  });

  report += `## Recommendations

1. **Critical Issues**: Fix all pages with ❌ status first
2. **Warnings**: Review and address warnings for better mobile experience
3. **Testing**: Test each page manually at different breakpoints
4. **Real Devices**: Test on actual mobile devices for best results

## Next Steps

1. Run manual visual tests using browser DevTools
2. Test on real devices (iPhone, Android, iPad)
3. Check for horizontal scrolling on all pages
4. Verify touch targets are ≥44px on mobile
5. Ensure forms don't trigger iOS zoom (16px+ font-size)
6. Test modals are full-screen on mobile
7. Verify tables scroll horizontally on mobile

---

*Report generated by test-responsive-pages.js*
`;

  return report;
}

// Main execution
console.log("🧪 Testing responsive design for all pages...\n");

const results = mainPages.map((page) => checkPage(page));

// Print summary to console
console.log("=".repeat(80));
console.log("RESPONSIVE PAGE TESTING SUMMARY");
console.log("=".repeat(80));
console.log(`Total Pages: ${results.length}`);
console.log(
  `Pages with Issues: ${results.filter((r) => r.issues.length > 0).length}`,
);
console.log(
  `Pages with Warnings: ${results.filter((r) => r.warnings.length > 0).length}`,
);
console.log(
  `Total Issues: ${results.reduce((sum, r) => sum + r.issues.length, 0)}`,
);
console.log(
  `Total Warnings: ${results.reduce((sum, r) => sum + r.warnings.length, 0)}`,
);
console.log("=".repeat(80));
console.log("\n");

// Print page results
results.forEach((result) => {
  if (
    result.issues.length > 0 ||
    result.warnings.length > 0 ||
    !result.exists
  ) {
    const status = result.exists
      ? result.issues.length === 0
        ? "⚠️"
        : "❌"
      : "❌";
    console.log(`${status} ${result.page} (Score: ${result.score}/100)`);
    if (result.issues.length > 0) {
      result.issues.forEach((issue) => console.log(`   ❌ ${issue}`));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`   ⚠️ ${warning}`));
    }
    console.log("");
  }
});

// Generate report file
const reportPath = path.join(__dirname, "..", "RESPONSIVE_PAGE_TEST_REPORT.md");
const report = generateReport(results);
fs.writeFileSync(reportPath, report, "utf8");

console.log(`\n📊 Full report saved to: RESPONSIVE_PAGE_TEST_REPORT.md\n`);
