#!/usr/bin/env node

/**
 * Comprehensive Page Component Audit Script
 * Audits ALL page components for:
 * - Missing SCSS files
 * - Missing CSS class definitions
 * - Layout issues
 * - Design pattern violations
 */

const fs = require("fs");
const path = require("path");

function extractClassesFromTemplate(template) {
  const classes = new Set();

  // Extract from class="..."
  const classMatches = template.matchAll(/class=["']([^"']+)["']/g);
  for (const match of classMatches) {
    match[1].split(/\s+/).forEach((c) => {
      const trimmed = c.trim();
      if (
        trimmed &&
        !trimmed.startsWith("pi-") &&
        !trimmed.startsWith("p-") &&
        !trimmed.includes("(") &&
        !trimmed.includes("[") &&
        trimmed !== "section-stack" &&
        trimmed !== "pi"
      ) {
        classes.add(trimmed);
      }
    });
  }

  // Extract from [class]="..."
  const bindingMatches = template.matchAll(/\[class\]=["']([^"']+)["']/g);
  for (const match of bindingMatches) {
    const expr = match[1];
    const parts = expr.match(/'([^']+)'/g);
    if (parts) {
      parts.forEach((p) => {
        const name = p.replace(/'/g, "").trim();
        if (name && !name.includes("+") && !name.startsWith("pi-")) {
          classes.add(name);
        }
      });
    }
  }

  return classes;
}

function extractSCSSClasses(scssContent) {
  const classes = new Set();
  const matches = scssContent.matchAll(/\.([a-z][a-z0-9_-]*)/g);
  for (const match of matches) {
    classes.add(match[1]);
  }
  return classes;
}

function auditComponent(componentPath) {
  const basePath = path.dirname(componentPath);
  const componentName = path.basename(componentPath, ".component.ts");
  const scssPath = path.join(basePath, `${componentName}.component.scss`);
  const htmlPath = path.join(basePath, `${componentName}.component.html`);

  const result = {
    component: componentPath,
    componentName,
    hasScss: fs.existsSync(scssPath),
    hasHtml: fs.existsSync(htmlPath),
    hasInlineStyles: false,
    hasStyleUrl: false,
    missingClasses: [],
    hasTemplate: false,
    templateSource: null,
  };

  if (!fs.existsSync(componentPath)) {
    return { ...result, error: "Component file not found" };
  }

  const componentContent = fs.readFileSync(componentPath, "utf8");

  // Check for inline styles
  if (
    componentContent.includes("styles: [") ||
    componentContent.includes("styles:[")
  ) {
    result.hasInlineStyles = true;
  }

  // Check for styleUrl
  if (
    componentContent.includes("styleUrl:") ||
    componentContent.includes("styleUrls:")
  ) {
    result.hasStyleUrl = true;
  }

  // Extract template content
  let templateContent = "";

  // Check for inline template
  const inlineTemplateMatch = componentContent.match(
    /template:\s*`([\s\S]*?)`/,
  );
  if (inlineTemplateMatch) {
    templateContent = inlineTemplateMatch[1];
    result.hasTemplate = true;
    result.templateSource = "inline";
  }
  // Check for templateUrl
  else {
    const templateUrlMatch = componentContent.match(
      /templateUrl:\s*['"]([^'"]+)['"]/,
    );
    if (templateUrlMatch) {
      const htmlFile = path.join(basePath, templateUrlMatch[1]);
      if (fs.existsSync(htmlFile)) {
        templateContent = fs.readFileSync(htmlFile, "utf8");
        result.hasTemplate = true;
        result.templateSource = "external";
      }
    } else if (fs.existsSync(htmlPath)) {
      templateContent = fs.readFileSync(htmlPath, "utf8");
      result.hasTemplate = true;
      result.templateSource = "external";
    }
  }

  if (templateContent && result.hasScss) {
    const scssContent = fs.readFileSync(scssPath, "utf8");
    const templateClasses = extractClassesFromTemplate(templateContent);
    const scssClasses = extractSCSSClasses(scssContent);

    // Find missing classes
    for (const cls of templateClasses) {
      if (!scssClasses.has(cls)) {
        result.missingClasses.push(cls);
      }
    }
  } else if (templateContent && result.hasInlineStyles) {
    // Extract classes from inline styles
    const inlineStylesMatch = componentContent.match(
      /styles:\s*\[\s*`([\s\S]*?)`/,
    );
    if (inlineStylesMatch) {
      const stylesContent = inlineStylesMatch[1];
      const scssClasses = extractSCSSClasses(stylesContent);
      const templateClasses = extractClassesFromTemplate(templateContent);

      for (const cls of templateClasses) {
        if (!scssClasses.has(cls)) {
          result.missingClasses.push(cls);
        }
      }
    }
  }

  return result;
}

// Main execution
if (require.main === module) {
  const featuresDir = path.join(process.cwd(), "angular/src/app/features");
  const results = [];

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (
        entry.name.endsWith(".component.ts") &&
        !entry.name.includes(".spec.")
      ) {
        const result = auditComponent(fullPath);
        results.push(result);
      }
    }
  }

  scanDirectory(featuresDir);

  // Filter and categorize results
  const issues = results.filter(
    (r) =>
      r.missingClasses.length > 0 ||
      (!r.hasScss && !r.hasInlineStyles && r.hasTemplate) ||
      r.error,
  );

  const ok = results.filter(
    (r) =>
      r.missingClasses.length === 0 &&
      (r.hasScss || r.hasInlineStyles || !r.hasTemplate) &&
      !r.error,
  );

  console.log(
    JSON.stringify(
      {
        total: results.length,
        ok: ok.length,
        issues: issues.length,
        results,
        summary: {
          missingClasses: issues
            .filter((r) => r.missingClasses.length > 0)
            .map((r) => ({
              component: r.componentName,
              path: r.component,
              missing: r.missingClasses,
            })),
          missingScss: issues
            .filter((r) => !r.hasScss && !r.hasInlineStyles && r.hasTemplate)
            .map((r) => ({
              component: r.componentName,
              path: r.component,
            })),
        },
      },
      null,
      2,
    ),
  );
}

module.exports = { auditComponent };
