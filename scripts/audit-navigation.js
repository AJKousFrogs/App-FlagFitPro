#!/usr/bin/env node

/**
 * Navigation Audit Script
 * Checks all HTML files for sidebar navigation consistency
 */

const fs = require("fs");
const path = require("path");

const htmlFiles = [
  "dashboard.html",
  "analytics.html",
  "training.html",
  "roster.html",
  "tournaments.html",
  "settings.html",
  "community.html",
  "coach.html",
  "chat.html",
  "workout.html",
  "training-schedule.html",
  "qb-training-schedule.html",
  "exercise-library.html",
  "login.html",
  "register.html",
  "index.html",
];

const issues = {
  missingSidebar: [],
  inconsistentStructure: [],
  missingDashboardContainer: [],
  layoutIssues: [],
};

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const hasSidebar =
    /class=["']sidebar["']/.test(content) || /<aside.*sidebar/.test(content);
  const hasDashboardContainer = /class=["']dashboard-container["']/.test(
    content,
  );
  const hasNavSection = /nav-section/.test(content);
  const hasNavItem = /nav-item/.test(content);
  const hasSidebarIcon = /sidebar-icon/.test(content);
  const hasMainContent = /class=["']main-content["']/.test(content);

  return {
    exists: true,
    hasSidebar,
    hasDashboardContainer,
    hasNavSection,
    hasNavItem,
    hasSidebarIcon,
    hasMainContent,
    content,
  };
}

console.log("🔍 Auditing navigation across all HTML pages...\n");

htmlFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  const result = checkFile(filePath);

  if (!result.exists) {
    console.log(`⚠️  ${file}: FILE NOT FOUND`);
    return;
  }

  const problems = [];

  if (
    !result.hasSidebar &&
    !["login.html", "register.html", "index.html"].includes(file)
  ) {
    problems.push("MISSING SIDEBAR");
    issues.missingSidebar.push(file);
  }

  if (
    !result.hasDashboardContainer &&
    !["login.html", "register.html", "index.html"].includes(file)
  ) {
    problems.push("MISSING DASHBOARD CONTAINER");
    issues.missingDashboardContainer.push(file);
  }

  if (result.hasSidebar) {
    if (result.hasNavSection && result.hasNavItem) {
      // Dashboard-style sidebar
      if (file !== "dashboard.html") {
        problems.push("INCONSISTENT: Uses dashboard-style sidebar");
        issues.inconsistentStructure.push({ file, type: "dashboard-style" });
      }
    } else if (result.hasSidebarIcon) {
      // Icon-only sidebar
      if (file === "dashboard.html") {
        problems.push(
          "INCONSISTENT: Uses icon-only sidebar (should be dashboard-style)",
        );
        issues.inconsistentStructure.push({ file, type: "icon-only" });
      }
    }
  }

  if (
    !result.hasMainContent &&
    !["login.html", "register.html", "index.html"].includes(file)
  ) {
    problems.push("MISSING MAIN CONTENT");
    issues.layoutIssues.push({ file, issue: "missing main-content" });
  }

  const status = problems.length > 0 ? `❌ ${problems.join(", ")}` : "✅ OK";
  console.log(`${status.padEnd(60)} ${file}`);
});

console.log("\n📊 SUMMARY:\n");
console.log(`Missing Sidebar: ${issues.missingSidebar.length} files`);
if (issues.missingSidebar.length > 0) {
  issues.missingSidebar.forEach((f) => console.log(`  - ${f}`));
}

console.log(
  `\nInconsistent Structure: ${issues.inconsistentStructure.length} files`,
);
if (issues.inconsistentStructure.length > 0) {
  issues.inconsistentStructure.forEach(({ file, type }) => {
    console.log(`  - ${file}: ${type}`);
  });
}

console.log(
  `\nMissing Dashboard Container: ${issues.missingDashboardContainer.length} files`,
);
if (issues.missingDashboardContainer.length > 0) {
  issues.missingDashboardContainer.forEach((f) => console.log(`  - ${f}`));
}

console.log(`\nLayout Issues: ${issues.layoutIssues.length} files`);
if (issues.layoutIssues.length > 0) {
  issues.layoutIssues.forEach(({ file, issue }) => {
    console.log(`  - ${file}: ${issue}`);
  });
}

// Write report
const report = {
  timestamp: new Date().toISOString(),
  issues,
  totalFiles: htmlFiles.length,
  filesWithIssues:
    issues.missingSidebar.length +
    issues.inconsistentStructure.length +
    issues.missingDashboardContainer.length +
    issues.layoutIssues.length,
};

fs.writeFileSync(
  path.join(__dirname, "..", "NAVIGATION_AUDIT_REPORT.json"),
  JSON.stringify(report, null, 2),
);

console.log(
  "\n✅ Audit complete! Report saved to NAVIGATION_AUDIT_REPORT.json",
);
