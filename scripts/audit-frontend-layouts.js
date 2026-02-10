#!/usr/bin/env node

/**
 * Frontend Layout Audit Script
 * Audits Angular components for:
 * - Missing SCSS files
 * - CSS classes used in HTML without styles
 * - Layout containers without grid/flex styles
 * - Missing responsive breakpoints
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const featuresDir = path.join(__dirname, "../angular/src/app/features");
const sharedDir = path.join(__dirname, "../angular/src/app/shared/components");

const issues = {
  missingScssFiles: [],
  missingLayoutStyles: [],
  unusedCssClasses: [],
  missingResponsive: [],
  emptyScssFiles: [],
  classesWithoutStyles: [],
};

function extractClasses(html) {
  const classMatches = html.match(/class=["']([^"']+)["']/g) || [];
  const classes = new Set();

  classMatches.forEach((match) => {
    const classStr = match.replace(/class=["']/, "").replace(/["']/, "");
    classStr.split(/\s+/).forEach((cls) => {
      if (cls && !cls.startsWith("p-") && !cls.startsWith("ng-")) {
        classes.add(cls);
      }
    });
  });

  return Array.from(classes);
}

function extractSelectors(scss) {
  const selectors = new Set();
  const lines = scss.split("\n");

  for (const line of lines) {
    const selectorMatches = line.match(/^([.#][\w-]+)/g);
    if (selectorMatches) {
      selectorMatches.forEach((sel) => {
        const clean = sel.replace(/^[.#]/, "");
        if (clean && !clean.includes("(") && !clean.includes(":")) {
          selectors.add(clean);
        }
      });
    }
  }

  return Array.from(selectors);
}

function checkLayoutContainers(html, scss) {
  const layoutClasses = [
    "grid",
    "flex",
    "container",
    "wrapper",
    "content",
    "layout",
    "page",
    "section",
    "row",
    "column",
  ];

  const htmlClasses = extractClasses(html);
  const scssSelectors = extractSelectors(scss);

  const missing = [];
  htmlClasses.forEach((cls) => {
    const isLayoutClass = layoutClasses.some((layout) =>
      cls.toLowerCase().includes(layout),
    );

    if (isLayoutClass && !scssSelectors.includes(cls)) {
      missing.push(cls);
    }
  });

  return missing;
}

function checkComponent(componentPath) {
  const dir = path.dirname(componentPath);
  const baseName = path.basename(componentPath, ".component.ts");
  const scssPath = path.join(dir, `${baseName}.component.scss`);
  const htmlPath = path.join(dir, `${baseName}.component.html`);

  const result = {
    component: componentPath,
    hasScss: fs.existsSync(scssPath),
    hasHtml: fs.existsSync(htmlPath),
    scssPath,
    htmlPath,
    issues: [],
  };

  if (!result.hasScss) {
    issues.missingScssFiles.push(componentPath);
    result.issues.push("Missing SCSS file");
  }

  if (!result.hasHtml) {
    const componentContent = fs.readFileSync(componentPath, "utf8");
    if (
      !componentContent.includes("template:`") &&
      !componentContent.includes("template: `")
    ) {
      result.issues.push("No HTML template found");
    }
  }

  if (result.hasScss && result.hasHtml) {
    const html = fs.readFileSync(htmlPath, "utf8");
    const scss = fs.readFileSync(scssPath, "utf8");

    if (scss.trim().length < 50) {
      issues.emptyScssFiles.push(componentPath);
      result.issues.push("SCSS file is empty or minimal");
    }

    const missingLayouts = checkLayoutContainers(html, scss);
    if (missingLayouts.length > 0) {
      issues.missingLayoutStyles.push({
        component: componentPath,
        classes: missingLayouts,
      });
      result.issues.push(
        `Missing layout styles for: ${missingLayouts.join(", ")}`,
      );
    }

    const htmlClasses = extractClasses(html);
    const scssSelectors = extractSelectors(scss);

    const unstyledClasses = htmlClasses.filter((cls) => {
      if (
        cls.startsWith("p-") ||
        cls.startsWith("ng-") ||
        cls.includes("--") ||
        scssSelectors.includes(cls) ||
        scss.includes(`.${cls}`) ||
        scss.includes(`#${cls}`)
      ) {
        return false;
      }
      return true;
    });

    if (unstyledClasses.length > 0) {
      issues.classesWithoutStyles.push({
        component: componentPath,
        classes: unstyledClasses,
      });
    }
  }

  return result;
}

function findComponents(dir) {
  const components = [];

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach((file) => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes("node_modules")) {
        walk(filePath);
      } else if (file.endsWith(".component.ts")) {
        components.push(filePath);
      }
    });
  }

  walk(dir);
  return components;
}

function audit() {
  console.log("🔍 Frontend Layout Audit\n");
  console.log("Scanning components...\n");

  const featureComponents = findComponents(featuresDir);
  const sharedComponents = findComponents(sharedDir);
  const allComponents = [...featureComponents, ...sharedComponents];

  console.log(`Found ${allComponents.length} components\n`);

  const results = allComponents.map(checkComponent);

  console.log("=".repeat(80));
  console.log("AUDIT RESULTS");
  console.log("=".repeat(80));
  console.log();

  if (issues.missingScssFiles.length > 0) {
    console.log(`❌ Missing SCSS Files (${issues.missingScssFiles.length}):`);
    issues.missingScssFiles.forEach((file) => {
      console.log(`   - ${path.relative(process.cwd(), file)}`);
    });
    console.log();
  }

  if (issues.emptyScssFiles.length > 0) {
    console.log(
      `⚠️  Empty/Minimal SCSS Files (${issues.emptyScssFiles.length}):`,
    );
    issues.emptyScssFiles.forEach((file) => {
      console.log(`   - ${path.relative(process.cwd(), file)}`);
    });
    console.log();
  }

  if (issues.missingLayoutStyles.length > 0) {
    console.log(
      `❌ Missing Layout Styles (${issues.missingLayoutStyles.length}):`,
    );
    issues.missingLayoutStyles.forEach((item) => {
      console.log(`   - ${path.relative(process.cwd(), item.component)}`);
      console.log(`     Classes: ${item.classes.join(", ")}`);
    });
    console.log();
  }

  if (issues.classesWithoutStyles.length > 0) {
    console.log(
      `⚠️  CSS Classes Without Styles (${issues.classesWithoutStyles.length}):`,
    );
    issues.classesWithoutStyles.slice(0, 20).forEach((item) => {
      console.log(`   - ${path.relative(process.cwd(), item.component)}`);
      console.log(
        `     Classes: ${item.classes.slice(0, 5).join(", ")}${item.classes.length > 5 ? "..." : ""}`,
      );
    });
    if (issues.classesWithoutStyles.length > 20) {
      console.log(`   ... and ${issues.classesWithoutStyles.length - 20} more`);
    }
    console.log();
  }

  console.log("=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total Components: ${allComponents.length}`);
  console.log(`Missing SCSS Files: ${issues.missingScssFiles.length}`);
  console.log(`Empty SCSS Files: ${issues.emptyScssFiles.length}`);
  console.log(`Missing Layout Styles: ${issues.missingLayoutStyles.length}`);
  console.log(`Classes Without Styles: ${issues.classesWithoutStyles.length}`);
  console.log();

  const reportPath = path.join(__dirname, "../docs/FRONTEND_LAYOUT_AUDIT.md");
  const report = generateMarkdownReport(results, issues);
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}

function generateMarkdownReport(results, issues) {
  let report = `# Frontend Layout Audit Report\n\n`;
  report += `**Date:** ${new Date().toISOString().split("T")[0]}\n\n`;
  report += `**Total Components Audited:** ${results.length}\n\n`;
  report += `---\n\n`;

  report += `## Critical Issues\n\n`;

  if (issues.missingScssFiles.length > 0) {
    report += `### Missing SCSS Files (${issues.missingScssFiles.length})\n\n`;
    issues.missingScssFiles.forEach((file) => {
      report += `- \`${path.relative(process.cwd(), file)}\`\n`;
    });
    report += `\n`;
  }

  if (issues.missingLayoutStyles.length > 0) {
    report += `### Missing Layout Styles (${issues.missingLayoutStyles.length})\n\n`;
    issues.missingLayoutStyles.forEach((item) => {
      report += `#### \`${path.basename(item.component)}\`\n\n`;
      report += `**Path:** \`${path.relative(process.cwd(), item.component)}\`\n\n`;
      report += `**Missing Styles For:**\n`;
      item.classes.forEach((cls) => {
        report += `- \`.${cls}\`\n`;
      });
      report += `\n`;
    });
  }

  report += `## All Issues\n\n`;
  report += `| Component | Issues |\n`;
  report += `|-----------|--------|\n`;

  results
    .filter((r) => r.issues.length > 0)
    .forEach((result) => {
      report += `| \`${path.basename(result.component)}\` | ${result.issues.join("; ")} |\n`;
    });

  return report;
}

audit();
