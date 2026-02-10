#!/usr/bin/env node

/**
 * Page Component Audit Script
 * Audits a single page component for:
 * - Missing SCSS files
 * - Missing CSS class definitions
 * - Layout issues
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);

function auditComponent(componentPath) {
  const basePath = path.dirname(componentPath);
  const componentName = path.basename(componentPath, ".component.ts");
  const scssPath = path.join(basePath, `${componentName}.component.scss`);
  const htmlPath = path.join(basePath, `${componentName}.component.html`);

  const issues = {
    component: componentPath,
    missingScss: !fs.existsSync(scssPath),
    missingHtml: !fs.existsSync(htmlPath),
    missingClasses: [],
    hasInlineStyles: false,
    hasStyleUrl: false,
  };

  if (!fs.existsSync(componentPath)) {
    return { ...issues, error: "Component file not found" };
  }

  const componentContent = fs.readFileSync(componentPath, "utf8");

  if (
    componentContent.includes("styles: [") ||
    componentContent.includes("styles:[")
  ) {
    issues.hasInlineStyles = true;
  }

  if (
    componentContent.includes("styleUrl:") ||
    componentContent.includes("styleUrls:")
  ) {
    issues.hasStyleUrl = true;
  }

  let templateContent = "";
  if (issues.hasInlineStyles) {
    const templateMatch = componentContent.match(/template:\s*`([\s\S]*?)`/);
    if (templateMatch) {
      templateContent = templateMatch[1];
    }
  } else if (fs.existsSync(htmlPath)) {
    templateContent = fs.readFileSync(htmlPath, "utf8");
  } else {
    const templateUrlMatch = componentContent.match(
      /templateUrl:\s*['"]([^'"]+)['"]/,
    );
    if (templateUrlMatch) {
      const htmlFile = path.join(basePath, templateUrlMatch[1]);
      if (fs.existsSync(htmlFile)) {
        templateContent = fs.readFileSync(htmlFile, "utf8");
      }
    }
  }

  if (templateContent && fs.existsSync(scssPath)) {
    const classMatches = templateContent.matchAll(/class=["']([^"']+)["']/g);
    const classes = new Set();
    for (const match of classMatches) {
      match[1].split(/\s+/).forEach((c) => {
        const trimmed = c.trim();
        if (
          trimmed &&
          !trimmed.startsWith("pi-") &&
          !trimmed.includes("(") &&
          !trimmed.includes("[")
        ) {
          classes.add(trimmed);
        }
      });
    }

    const scssContent = fs.readFileSync(scssPath, "utf8");
    const scssClasses = new Set();
    const scssMatches = scssContent.matchAll(/\.([a-z][a-z0-9_-]*)/g);
    for (const match of scssMatches) {
      scssClasses.add(match[1]);
    }

    for (const cls of classes) {
      if (!scssClasses.has(cls)) {
        issues.missingClasses.push(cls);
      }
    }
  }

  return issues;
}

// CLI - only run when executed directly (not when imported)
const isMain = process.argv[1]?.endsWith("audit-page-component.js") ||
  (process.argv[1] && path.resolve(process.cwd(), process.argv[1]) === __filename);

if (isMain) {
  const componentPath = process.argv[2];
  if (componentPath) {
    const issues = auditComponent(componentPath);
    console.log(JSON.stringify(issues, null, 2));
  } else {
    console.error("Usage: node audit-page-component.js <component-path>");
    process.exit(1);
  }
}

export { auditComponent };
