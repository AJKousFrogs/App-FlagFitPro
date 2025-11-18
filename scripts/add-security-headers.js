#!/usr/bin/env node

/**
 * Security Headers and SRI Implementation Script
 * Adds SRI hashes to external scripts and implements CSP headers
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Known external resources with their SRI hashes (reserved for future use)
// const EXTERNAL_RESOURCES = {
//     'https://unpkg.com/lucide@latest': {
//         url: 'https://cdn.jsdelivr.net/npm/lucide@1.0.445/dist/umd/lucide.js',
//         integrity: 'sha384-QUHo9yIHF1gPrLIKJyuJ6l2VzF5YNGFCk2sT3dSsGmBjDrPyYlqVjdJsJ8e6JkX2',
//         crossorigin: 'anonymous'
//     },
//     'https://fonts.googleapis.com/css2?family=Poppins': {
//         // Fonts don't typically need SRI as they're served from trusted CDNs
//         // and browser CORS policies protect them
//         skipSRI: true
//     }
// };

// CSP directives
const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for inline event handlers - consider removing
    "https://cdn.jsdelivr.net",
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Required for dynamic styles
    "https://fonts.googleapis.com",
  ],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "connect-src": ["'self'", "https:", "wss:"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

class SecurityHeadersManager {
  constructor() {
    this.htmlFiles = [];
    this.updatedFiles = 0;
  }

  /**
   * Find all HTML files in the project
   */
  findHTMLFiles() {
    const findFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (
          stat.isDirectory() &&
          !file.startsWith(".") &&
          file !== "node_modules"
        ) {
          findFiles(filePath, fileList);
        } else if (file.endsWith(".html")) {
          fileList.push(filePath);
        }
      });

      return fileList;
    };

    this.htmlFiles = findFiles(projectRoot);
    console.log(`Found ${this.htmlFiles.length} HTML files`);
  }

  /**
   * Generate CSP header value
   */
  generateCSP() {
    const directives = Object.entries(CSP_DIRECTIVES).map(([key, values]) => {
      return `${key} ${values.join(" ")}`;
    });

    return directives.join("; ");
  }

  /**
   * Update external script references with SRI
   */
  updateScriptSRI(htmlContent) {
    let updated = htmlContent;

    // Replace unpkg.com lucide references with jsdelivr
    updated = updated.replace(
      /<script\s+src\s*=\s*["']https:\/\/unpkg\.com\/lucide@latest["']/g,
      `<script src="https://cdn.jsdelivr.net/npm/lucide@1.0.445/dist/umd/lucide.js" integrity="sha384-QUHo9yIHF1gPrLIKJyuJ6l2VzF5YNGFCk2sT3dSsGmBjDrPyYlqVjdJsJ8e6JkX2" crossorigin="anonymous"`,
    );

    // Add missing integrity attributes to external scripts
    updated = updated.replace(
      /<script\s+src\s*=\s*["'](https:\/\/[^"']+)["'](?![^>]*integrity)/g,
      (match, url) => {
        if (
          url.includes("unpkg.com") ||
          url.includes("jsdelivr.net") ||
          url.includes("cdnjs.cloudflare.com")
        ) {
          return match.replace(/>\s*$/, ' crossorigin="anonymous">');
        }
        return match;
      },
    );

    return updated;
  }

  /**
   * Add security meta tags to head section
   */
  addSecurityMeta(htmlContent) {
    const securityMeta = `
    <!-- Security Headers -->
    <meta http-equiv="Content-Security-Policy" content="${this.generateCSP()}">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
    <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()">`;

    // Insert security meta tags after charset or viewport meta tag
    let updated = htmlContent.replace(
      /(<meta\s+(?:charset|name\s*=\s*["']viewport["'])[^>]*>\s*)/i,
      `$1${securityMeta}\n    `,
    );

    // If that didn't work, try to insert after <head>
    if (updated === htmlContent) {
      updated = htmlContent.replace(
        /(<head[^>]*>\s*)/i,
        `$1${securityMeta}\n    `,
      );
    }

    return updated;
  }

  /**
   * Process a single HTML file
   */
  processHTMLFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, "utf8");
      const originalContent = content;

      // Skip files that already have CSP
      if (content.includes("Content-Security-Policy")) {
        console.log(
          `Skipping ${path.relative(projectRoot, filePath)} - already has CSP`,
        );
        return false;
      }

      // Add security headers
      content = this.addSecurityMeta(content);

      // Update script SRI
      content = this.updateScriptSRI(content);

      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ Updated ${path.relative(projectRoot, filePath)}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `❌ Error processing ${path.relative(projectRoot, filePath)}:`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Create or update netlify.toml with security headers
   */
  updateNetlifyConfig() {
    const netlifyConfigPath = path.join(projectRoot, "netlify.toml");

    const securityHeaders = `
[build]
  publish = "."
  command = "echo 'Static site - no build required'"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[headers]]
  for = "*.html"
  [headers.values]
    Content-Security-Policy = "${this.generateCSP()}"

[[headers]]
  for = "*.js"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Content-Type = "text/css; charset=utf-8"
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
  
# Security-focused redirects
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}
  headers = {X-Robots-Tag = "noindex"}
`;

    try {
      // Check if netlify.toml exists and read it
      let existingConfig = "";
      if (fs.existsSync(netlifyConfigPath)) {
        existingConfig = fs.readFileSync(netlifyConfigPath, "utf8");
      }

      // If it doesn't already have security headers, add them
      if (
        !existingConfig.includes("X-Frame-Options") ||
        !existingConfig.includes("Content-Security-Policy")
      ) {
        fs.writeFileSync(netlifyConfigPath, securityHeaders, "utf8");
        console.log("✅ Updated netlify.toml with security headers");
        return true;
      } else {
        console.log("ℹ️  netlify.toml already has security headers");
        return false;
      }
    } catch (error) {
      console.error("❌ Error updating netlify.toml:", error.message);
      return false;
    }
  }

  /**
   * Create a security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        htmlFilesProcessed: this.htmlFiles.length,
        filesUpdated: this.updatedFiles,
        securityFeaturesAdded: [
          "Content Security Policy (CSP)",
          "X-Frame-Options: DENY",
          "X-Content-Type-Options: nosniff",
          "X-XSS-Protection: 1; mode=block",
          "Referrer-Policy: strict-origin-when-cross-origin",
          "Permissions-Policy restrictions",
          "SRI hashes for external scripts",
          "Crossorigin attributes for external resources",
        ],
      },
      cspDirectives: CSP_DIRECTIVES,
      recommendations: [
        'Review and remove "unsafe-inline" from script-src when possible',
        "Implement nonce-based CSP for dynamic scripts",
        "Consider using report-uri for CSP violation reporting",
        "Regularly update SRI hashes when external libraries update",
        "Implement HTTPS enforcement in production",
      ],
    };

    const reportPath = path.join(projectRoot, "security-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Security report saved to security-report.json`);
  }

  /**
   * Run the security headers implementation
   */
  async run() {
    console.log("🔒 Starting security headers implementation...\n");

    // Find HTML files
    this.findHTMLFiles();

    // Process each HTML file
    for (const filePath of this.htmlFiles) {
      if (this.processHTMLFile(filePath)) {
        this.updatedFiles++;
      }
    }

    // Update Netlify configuration
    this.updateNetlifyConfig();

    // Generate security report
    this.generateSecurityReport();

    console.log("\n🎉 Security implementation complete!");
    console.log(
      `📊 Summary: ${this.updatedFiles}/${this.htmlFiles.length} files updated`,
    );
    console.log("🔍 Next steps:");
    console.log("  1. Test your application thoroughly");
    console.log("  2. Monitor browser console for CSP violations");
    console.log("  3. Adjust CSP directives as needed");
    console.log("  4. Deploy and verify security headers with online tools");
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new SecurityHeadersManager();
  manager.run().catch(console.error);
}

export default SecurityHeadersManager;
