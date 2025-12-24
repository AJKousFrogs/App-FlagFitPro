// Comprehensive Routing Issues Checker
// Checks for incorrect import paths, URLs, API endpoints, and asset references

import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const issues = {
  importPaths: [],
  hrefLinks: [],
  apiEndpoints: [],
  assetPaths: [],
  redirects: [],
};

function getAllFiles(dir, extension, results = []) {
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (
        !file.startsWith(".") &&
        file !== "node_modules" &&
        file !== "dist" &&
        file !== ".git"
      ) {
        getAllFiles(filePath, extension, results);
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });

  return results;
}

// Check import paths in JS files
function checkImportPaths(filePath, content) {
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);
  const fileDir = path.dirname(filePath);

  // Match import/export statements
  const importPattern = /(?:import|export).*from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];

    // Skip external imports (http, https, npm packages)
    if (
      importPath.startsWith("http") ||
      importPath.startsWith("//") ||
      !importPath.startsWith(".")
    ) {
      continue;
    }

    // Resolve the import path
    const resolvedPath = path.resolve(fileDir, importPath);
    const actualPath = resolvedPath.endsWith(".js")
      ? resolvedPath
      : resolvedPath + ".js";

    // Check if file exists
    if (!fs.existsSync(actualPath)) {
      // Try without .js extension
      const pathWithoutExt = actualPath.replace(/\.js$/, "");
      if (!fs.existsSync(pathWithoutExt)) {
        issues.importPaths.push({
          file: relativePath,
          line: content.substring(0, match.index).split("\n").length,
          import: importPath,
          resolved: actualPath,
          issue: "File not found",
        });
      }
    }
  }
}

// Check href links in HTML files
function checkHrefLinks(filePath, content) {
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  // Match href attributes
  const hrefPattern = /href\s*=\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = hrefPattern.exec(content)) !== null) {
    const href = match[1];

    // Skip external links, anchors, and special protocols
    if (
      href.startsWith("http") ||
      href.startsWith("//") ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      // eslint-disable-next-line no-script-url
      href.startsWith("javascript:") ||
      href === "" ||
      href.startsWith("data:")
    ) {
      continue;
    }

    // Check if it's a relative path to HTML file
    if (href.endsWith(".html") || !href.includes(".")) {
      const fileDir = path.dirname(filePath);
      const resolvedPath = path.resolve(fileDir, href);

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        // Try with .html extension if not present
        if (!href.endsWith(".html")) {
          const withHtml = resolvedPath + ".html";
          if (!fs.existsSync(withHtml)) {
            issues.hrefLinks.push({
              file: relativePath,
              line: content.substring(0, match.index).split("\n").length,
              href: href,
              resolved: resolvedPath,
              issue: "File not found",
            });
          }
        } else {
          issues.hrefLinks.push({
            file: relativePath,
            line: content.substring(0, match.index).split("\n").length,
            href: href,
            resolved: resolvedPath,
            issue: "File not found",
          });
        }
      }
    }
  }
}

// Check src attributes (scripts, images, etc.)
function checkAssetPaths(filePath, content) {
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  // Match src attributes
  const srcPattern = /src\s*=\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = srcPattern.exec(content)) !== null) {
    const src = match[1];

    // Skip external URLs and data URIs
    if (
      src.startsWith("http") ||
      src.startsWith("//") ||
      src.startsWith("data:") ||
      src.startsWith("blob:")
    ) {
      continue;
    }

    const fileDir = path.dirname(filePath);
    const resolvedPath = path.resolve(fileDir, src);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      issues.assetPaths.push({
        file: relativePath,
        line: content.substring(0, match.index).split("\n").length,
        src: src,
        resolved: resolvedPath,
        issue: "File not found",
      });
    }
  }

  // Check link href for CSS
  const linkPattern = /<link[^>]*href\s*=\s*['"]([^'"]+)['"]/g;
  while ((match = linkPattern.exec(content)) !== null) {
    const href = match[1];

    if (
      href.startsWith("http") ||
      href.startsWith("//") ||
      href.startsWith("data:")
    ) {
      continue;
    }

    const fileDir = path.dirname(filePath);
    const resolvedPath = path.resolve(fileDir, href);

    if (!fs.existsSync(resolvedPath)) {
      issues.assetPaths.push({
        file: relativePath,
        line: content.substring(0, match.index).split("\n").length,
        src: href,
        resolved: resolvedPath,
        issue: "CSS/Asset file not found",
      });
    }
  }
}

// Check window.location redirects
function checkRedirects(filePath, content) {
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  // Match window.location.href assignments
  const redirectPattern = /window\.location\.href\s*=\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = redirectPattern.exec(content)) !== null) {
    const redirect = match[1];

    // Skip external URLs
    if (redirect.startsWith("http") || redirect.startsWith("//")) {
      continue;
    }

    // Check if it's a relative path to HTML file
    if (redirect.endsWith(".html") || !redirect.includes(".")) {
      const fileDir = path.dirname(filePath);
      const resolvedPath = path.resolve(fileDir, redirect);

      if (!fs.existsSync(resolvedPath)) {
        if (!redirect.endsWith(".html")) {
          const withHtml = resolvedPath + ".html";
          if (!fs.existsSync(withHtml)) {
            issues.redirects.push({
              file: relativePath,
              line: content.substring(0, match.index).split("\n").length,
              redirect: redirect,
              resolved: resolvedPath,
              issue: "Redirect target not found",
            });
          }
        } else {
          issues.redirects.push({
            file: relativePath,
            line: content.substring(0, match.index).split("\n").length,
            redirect: redirect,
            resolved: resolvedPath,
            issue: "Redirect target not found",
          });
        }
      }
    }
  }
}

// Check API endpoints for common issues
function checkApiEndpoints(filePath, content) {
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  // Match API calls
  const apiPattern =
    /(?:apiClient|fetch|axios)\.(?:get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
  let match;

  while ((match = apiPattern.exec(content)) !== null) {
    const endpoint = match[1];

    // Check for common issues
    if (endpoint.startsWith("/api/")) {
      // Check for double slashes
      if (endpoint.includes("//")) {
        issues.apiEndpoints.push({
          file: relativePath,
          line: content.substring(0, match.index).split("\n").length,
          endpoint: endpoint,
          issue: "Double slashes in endpoint",
        });
      }

      // Check for trailing slashes (might be intentional, but flag it)
      if (endpoint.endsWith("/") && endpoint !== "/api/") {
        issues.apiEndpoints.push({
          file: relativePath,
          line: content.substring(0, match.index).split("\n").length,
          endpoint: endpoint,
          issue: "Trailing slash in endpoint (may cause issues)",
        });
      }
    }
  }
}

// Main execution
console.log("🔍 Checking for routing issues...\n");

const rootDir = path.join(__dirname, "..");

// Get all JS and HTML files
const allJsFiles = getAllFiles(path.join(rootDir, "src"), ".js");
const allHtmlFiles = getAllFiles(rootDir, ".html");

// Filter out node_modules, dist, etc.
const jsFiles = allJsFiles.filter(
  (f) =>
    !f.includes("node_modules") && !f.includes("dist") && !f.includes(".git"),
);
const htmlFiles = allHtmlFiles.filter(
  (f) =>
    !f.includes("node_modules") && !f.includes("dist") && !f.includes(".git"),
);

console.log(
  `Found ${jsFiles.length} JS files and ${htmlFiles.length} HTML files\n`,
);

// Check JS files
jsFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    checkImportPaths(file, content);
    checkRedirects(file, content);
    checkApiEndpoints(file, content);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
});

// Check HTML files
htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    checkHrefLinks(file, content);
    checkAssetPaths(file, content);
    checkRedirects(file, content);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
});

// Generate report
let report = `# Routing Issues Report
Generated: ${new Date().toISOString()}

## Summary

- **Import Path Issues**: ${issues.importPaths.length}
- **Href Link Issues**: ${issues.hrefLinks.length}
- **Asset Path Issues**: ${issues.assetPaths.length}
- **Redirect Issues**: ${issues.redirects.length}
- **API Endpoint Issues**: ${issues.apiEndpoints.length}
- **Total Issues**: ${Object.values(issues).reduce((sum, arr) => sum + arr.length, 0)}

---

`;

// Import Path Issues
if (issues.importPaths.length > 0) {
  report += `## ❌ Import Path Issues (${issues.importPaths.length})\n\n`;
  issues.importPaths.forEach((issue) => {
    report += `### ${issue.file}:${issue.line}\n`;
    report += `- **Import**: \`${issue.import}\`\n`;
    report += `- **Resolved Path**: \`${issue.resolved}\`\n`;
    report += `- **Issue**: ${issue.issue}\n\n`;
  });
} else {
  report += `## ✅ Import Paths - No Issues Found\n\n`;
}

// Href Link Issues
if (issues.hrefLinks.length > 0) {
  report += `## ❌ Href Link Issues (${issues.hrefLinks.length})\n\n`;
  issues.hrefLinks.forEach((issue) => {
    report += `### ${issue.file}:${issue.line}\n`;
    report += `- **Href**: \`${issue.href}\`\n`;
    report += `- **Resolved Path**: \`${issue.resolved}\`\n`;
    report += `- **Issue**: ${issue.issue}\n\n`;
  });
} else {
  report += `## ✅ Href Links - No Issues Found\n\n`;
}

// Asset Path Issues
if (issues.assetPaths.length > 0) {
  report += `## ❌ Asset Path Issues (${issues.assetPaths.length})\n\n`;
  issues.assetPaths.forEach((issue) => {
    report += `### ${issue.file}:${issue.line}\n`;
    report += `- **Path**: \`${issue.src}\`\n`;
    report += `- **Resolved Path**: \`${issue.resolved}\`\n`;
    report += `- **Issue**: ${issue.issue}\n\n`;
  });
} else {
  report += `## ✅ Asset Paths - No Issues Found\n\n`;
}

// Redirect Issues
if (issues.redirects.length > 0) {
  report += `## ❌ Redirect Issues (${issues.redirects.length})\n\n`;
  issues.redirects.forEach((issue) => {
    report += `### ${issue.file}:${issue.line}\n`;
    report += `- **Redirect**: \`${issue.redirect}\`\n`;
    report += `- **Resolved Path**: \`${issue.resolved}\`\n`;
    report += `- **Issue**: ${issue.issue}\n\n`;
  });
} else {
  report += `## ✅ Redirects - No Issues Found\n\n`;
}

// API Endpoint Issues
if (issues.apiEndpoints.length > 0) {
  report += `## ⚠️ API Endpoint Issues (${issues.apiEndpoints.length})\n\n`;
  issues.apiEndpoints.forEach((issue) => {
    report += `### ${issue.file}:${issue.line}\n`;
    report += `- **Endpoint**: \`${issue.endpoint}\`\n`;
    report += `- **Issue**: ${issue.issue}\n\n`;
  });
} else {
  report += `## ✅ API Endpoints - No Issues Found\n\n`;
}

report += `---

## Recommendations

1. **Fix all import path issues** - These will cause runtime errors
2. **Fix href link issues** - These will cause 404 errors
3. **Fix asset path issues** - These will cause missing resources
4. **Review redirect issues** - These may cause navigation problems
5. **Review API endpoint issues** - These may cause API call failures

---

*Report generated by check-routing-issues.js*
`;

// Save report
const reportPath = path.join(rootDir, "ROUTING_ISSUES_REPORT.md");
fs.writeFileSync(reportPath, report, "utf8");

// Print summary
console.log("=".repeat(80));
console.log("ROUTING ISSUES SUMMARY");
console.log("=".repeat(80));
console.log(`Import Path Issues: ${issues.importPaths.length}`);
console.log(`Href Link Issues: ${issues.hrefLinks.length}`);
console.log(`Asset Path Issues: ${issues.assetPaths.length}`);
console.log(`Redirect Issues: ${issues.redirects.length}`);
console.log(`API Endpoint Issues: ${issues.apiEndpoints.length}`);
console.log(
  `Total Issues: ${Object.values(issues).reduce((sum, arr) => sum + arr.length, 0)}`,
);
console.log("=".repeat(80));
console.log(`\n📊 Full report saved to: ROUTING_ISSUES_REPORT.md\n`);

// Print details
if (issues.importPaths.length > 0) {
  console.log("\n❌ Import Path Issues:");
  issues.importPaths.forEach((issue) => {
    console.log(`   ${issue.file}:${issue.line} - ${issue.import}`);
  });
}

if (issues.hrefLinks.length > 0) {
  console.log("\n❌ Href Link Issues:");
  issues.hrefLinks.forEach((issue) => {
    console.log(`   ${issue.file}:${issue.line} - ${issue.href}`);
  });
}

if (issues.assetPaths.length > 0) {
  console.log("\n❌ Asset Path Issues:");
  issues.assetPaths.forEach((issue) => {
    console.log(`   ${issue.file}:${issue.line} - ${issue.src}`);
  });
}

if (issues.redirects.length > 0) {
  console.log("\n❌ Redirect Issues:");
  issues.redirects.forEach((issue) => {
    console.log(`   ${issue.file}:${issue.line} - ${issue.redirect}`);
  });
}

if (issues.apiEndpoints.length > 0) {
  console.log("\n⚠️ API Endpoint Issues:");
  issues.apiEndpoints.forEach((issue) => {
    console.log(`   ${issue.file}:${issue.line} - ${issue.endpoint}`);
  });
}

if (Object.values(issues).every((arr) => arr.length === 0)) {
  console.log("\n✅ No routing issues found!");
}
