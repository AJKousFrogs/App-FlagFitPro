#!/usr/bin/env node

/**
 * Page Component Audit Script
 * Audits a single page component for:
 * - Missing SCSS files
 * - Missing CSS class definitions
 * - Layout issues
 */

const fs = require('fs');
const path = require('path');

function auditComponent(componentPath) {
  const basePath = path.dirname(componentPath);
  const componentName = path.basename(componentPath, '.component.ts');
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
    return { ...issues, error: 'Component file not found' };
  }

  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  // Check for inline styles
  if (componentContent.includes('styles: [') || componentContent.includes('styles:[')) {
    issues.hasInlineStyles = true;
  }
  
  // Check for styleUrl
  if (componentContent.includes('styleUrl:') || componentContent.includes('styleUrls:')) {
    issues.hasStyleUrl = true;
  }

  // Extract template content
  let templateContent = '';
  if (issues.hasInlineStyles) {
    // Extract inline template
    const templateMatch = componentContent.match(/template:\s*`([\s\S]*?)`/);
    if (templateMatch) {
      templateContent = templateMatch[1];
    }
  } else if (fs.existsSync(htmlPath)) {
    templateContent = fs.readFileSync(htmlPath, 'utf8');
  } else {
    // Try to find templateUrl
    const templateUrlMatch = componentContent.match(/templateUrl:\s*['"]([^'"]+)['"]/);
    if (templateUrlMatch) {
      const htmlFile = path.join(basePath, templateUrlMatch[1]);
      if (fs.existsSync(htmlFile)) {
        templateContent = fs.readFileSync(htmlFile, 'utf8');
      }
    }
  }

  if (templateContent && fs.existsSync(scssPath)) {
    // Extract CSS classes from template
    const classMatches = templateContent.matchAll(/class=["']([^"']+)["']/g);
    const classes = new Set();
    for (const match of classMatches) {
      match[1].split(/\s+/).forEach(c => {
        const trimmed = c.trim();
        if (trimmed && !trimmed.startsWith('pi-') && !trimmed.includes('(') && !trimmed.includes('[')) {
          classes.add(trimmed);
        }
      });
    }

    // Extract CSS class selectors from SCSS
    const scssContent = fs.readFileSync(scssPath, 'utf8');
    const scssClasses = new Set();
    const scssMatches = scssContent.matchAll(/\.([a-z][a-z0-9_-]*)/g);
    for (const match of scssMatches) {
      scssClasses.add(match[1]);
    }

    // Find missing classes
    for (const cls of classes) {
      if (!scssClasses.has(cls)) {
        issues.missingClasses.push(cls);
      }
    }
  }

  return issues;
}

// Main execution
if (require.main === module) {
  const componentPath = process.argv[2];
  if (!componentPath) {
    console.error('Usage: node audit-page-component.js <component-path>');
    process.exit(1);
  }

  const issues = auditComponent(componentPath);
  console.log(JSON.stringify(issues, null, 2));
}

module.exports = { auditComponent };

