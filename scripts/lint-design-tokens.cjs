#!/usr/bin/env node
/**
 * Design Token Linting Script
 * ===========================
 * 
 * Scans SCSS files for:
 * 1. Deprecated token usage
 * 2. Hardcoded values that should use tokens
 * 3. Forbidden patterns (pill shapes, !important, etc.)
 * 
 * Usage:
 *   node scripts/lint-design-tokens.cjs [--fix] [--ci] [path]
 * 
 * Options:
 *   --fix    Attempt to auto-fix some violations (WIP)
 *   --ci     Exit with code 1 on any errors (for CI pipelines)
 *   path     Specific file or directory to lint (default: angular/src)
 * 
 * Exit codes:
 *   0: No errors (warnings allowed)
 *   1: Errors found (in --ci mode, also exits 1 for warnings)
 * 
 * Updated: January 9, 2026
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

// ===========================================
// CONFIGURATION
// ===========================================

const CONFIG = {
  // Deprecated tokens (January 9, 2026)
  deprecatedTokens: {
    // Font display sizes
    "--font-display-2xl": { replacement: "--font-h1-size", reason: "Use unified typography" },
    "--font-display-xl": { replacement: "--font-h1-size", reason: "Use unified typography" },
    "--font-display-lg": { replacement: "--font-h1-size", reason: "Use unified typography" },
    "--font-display-md": { replacement: "--font-h1-size", reason: "Use unified typography" },
    "--font-display-sm": { replacement: "--font-h1-size", reason: "Use unified typography" },
    // Font heading sizes
    "--font-heading-2xl": { replacement: "--font-h1-size", reason: "Use unified typography" },
    "--font-heading-xl": { replacement: "--font-h2-size", reason: "Use unified typography" },
    "--font-heading-lg": { replacement: "--font-h2-size", reason: "Use unified typography" },
    "--font-heading-md": { replacement: "--font-h3-size", reason: "Use unified typography" },
    "--font-heading-sm": { replacement: "--font-h4-size", reason: "Use unified typography" },
    "--font-heading-xs": { replacement: "--font-h4-size", reason: "Use unified typography" },
    // Font body sizes
    "--font-body-lg": { replacement: "--font-body-size", reason: "Use unified typography" },
    "--font-body-md": { replacement: "--font-body-size", reason: "Use unified typography" },
    "--font-body-sm": { replacement: "--font-body-sm-size", reason: "Use unified typography" },
    "--font-body-xs": { replacement: "--font-caption-size", reason: "Use unified typography" },
    "--font-body-2xs": { replacement: "--font-caption-size", reason: "Minimum 12px for accessibility" },
    "--font-body-3xs": { replacement: "--font-caption-size", reason: "Minimum 12px for accessibility" },
    // Font compact sizes
    "--font-compact-sm": { replacement: "--font-compact-md", reason: "Minimum 11px for accessibility" },
    "--font-compact-xs": { replacement: "--font-compact-md", reason: "Minimum 11px for accessibility" },
    // Text aliases
    "--text-xs": { replacement: "--font-caption-size", reason: "Use canonical tokens" },
    "--text-sm": { replacement: "--font-body-sm-size", reason: "Use canonical tokens" },
    "--text-base": { replacement: "--font-body-size", reason: "Use canonical tokens" },
    "--text-md": { replacement: "--font-body-size", reason: "Use canonical tokens" },
    "--text-lg": { replacement: "--font-body-size", reason: "Use canonical tokens" },
    "--text-xl": { replacement: "--font-h3-size", reason: "Use canonical tokens" },
    "--text-2xl": { replacement: "--font-h2-size", reason: "Use canonical tokens" },
    "--text-3xl": { replacement: "--font-h2-size", reason: "Use canonical tokens" },
    "--text-4xl": { replacement: "--font-h1-size", reason: "Use canonical tokens" },
    "--text-5xl": { replacement: "--font-h1-size", reason: "Use canonical tokens" },
    // Font size aliases
    "--font-xs": { replacement: "--font-caption-size", reason: "Use canonical tokens" },
    "--font-sm": { replacement: "--font-body-sm-size", reason: "Use canonical tokens" },
    "--font-base": { replacement: "--font-body-size", reason: "Use canonical tokens" },
    "--font-lg": { replacement: "--font-body-size", reason: "Use canonical tokens" },
    "--font-xl": { replacement: "--font-h3-size", reason: "Use canonical tokens" },
    "--font-2xl": { replacement: "--font-h2-size", reason: "Use canonical tokens" },
    "--font-3xl": { replacement: "--font-h2-size", reason: "Use canonical tokens" },
  },

  // Forbidden patterns
  forbiddenPatterns: [
    {
      pattern: /border-radius:\s*(9999|100)px/gi,
      message: "Pill shape (9999px/100px) forbidden for buttons/cards. Use --radius-lg (8px).",
      severity: "error",
      rule: "DESIGN_SYSTEM_RULES.md 4.3",
    },
    {
      pattern: /\[rounded\]\s*=\s*["']true["']/gi,
      message: "[rounded]=\"true\" is forbidden. Buttons use raised rectangular style.",
      severity: "error",
      rule: "DESIGN_SYSTEM_RULES.md 6.2",
    },
    {
      pattern: /transition:\s*all\b/gi,
      message: "transition: all is forbidden. Specify individual properties.",
      severity: "error",
      rule: "DESIGN_SYSTEM_RULES.md 7.2",
    },
    {
      pattern: /:focus(?!-visible)[\s,{]/g,
      message: ":focus is forbidden. Use :focus-visible instead.",
      severity: "warning",
      rule: "DESIGN_SYSTEM_RULES.md 7.1",
    },
  ],

  // Hardcoded value patterns (warnings)
  hardcodedPatterns: [
    {
      pattern: /(?<!var\([^)]*)(#[0-9a-fA-F]{3,8})(?![^(]*\))/g,
      message: "Hardcoded hex color. Use var(--color-*) or var(--ds-*) tokens.",
      severity: "warning",
      rule: "DESIGN_SYSTEM_RULES.md 4.1",
      allowedFiles: ["design-system-tokens.scss", "primeng-theme.scss"],
    },
    {
      // Only match padding declarations, not comments
      pattern: /^\s*padding:\s*\d+px/gim,
      message: "Hardcoded padding. Use var(--space-*) tokens.",
      severity: "warning",
      rule: "DESIGN_SYSTEM_RULES.md 4.2",
    },
    {
      pattern: /^\s*margin:\s*\d+px/gim,
      message: "Hardcoded margin. Use var(--space-*) tokens.",
      severity: "warning",
      rule: "DESIGN_SYSTEM_RULES.md 4.2",
    },
    {
      pattern: /^\s*gap:\s*\d+px/gim,
      message: "Hardcoded gap. Use var(--space-*) tokens.",
      severity: "warning",
      rule: "DESIGN_SYSTEM_RULES.md 4.2",
    },
    {
      pattern: /^\s*font-size:\s*\d+px/gim,
      message: "Hardcoded font-size. Use var(--font-*-size) tokens.",
      severity: "warning",
      rule: "DESIGN_SYSTEM_RULES.md 4.4",
    },
    {
      // Only warn on z-index >= 3 (0, 1, 2, -1 are acceptable for simple stacking)
      pattern: /z-index:\s*(?!var\(|0|1|2|-1|auto|inherit|initial|unset)[3-9]\d*/gi,
      message: "Hardcoded z-index. Use var(--z-*) tokens.",
      severity: "warning",
      rule: "DESIGN_SYSTEM_RULES.md (z-index scale)",
    },
  ],

  // Files/directories to skip
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/.angular/**",
    "**/coverage/**",
    "**/*.min.css",
    "**/*.min.scss",
  ],

  // Files where certain rules are relaxed
  relaxedFiles: {
    "design-system-tokens.scss": ["hardcodedHex", "deprecatedTokens"],
    "primeng-theme.scss": ["hardcodedHex"],
    "_token-mapping.scss": ["hardcodedHex"],
    "color-contrast-fixes.scss": ["hardcodedHex"],
    "cascade-layers.scss": ["hardcodedHex"], // Defines tokens in CSS layers
    "_exceptions.scss": ["hardcodedHex", "hardcodedFontSize", "hardcodedSpacing", "hardcodedZIndex"], // Documented exceptions
    // Mobile files use 16px font-size intentionally to prevent iOS zoom
    "_mobile-touch-components.scss": ["hardcodedFontSize"],
    "_mobile-responsive.scss": ["hardcodedFontSize"],
  },
};

// ===========================================
// COLORS FOR OUTPUT
// ===========================================
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

// ===========================================
// LINTING FUNCTIONS
// ===========================================

function lintFile(filePath, content) {
  const results = {
    errors: [],
    warnings: [],
    deprecations: [],
  };

  const fileName = path.basename(filePath);
  const relaxedRules = CONFIG.relaxedFiles[fileName] || [];
  const lines = content.split("\n");

  // Check for deprecated tokens
  if (!relaxedRules.includes("deprecatedTokens")) {
    for (const [token, info] of Object.entries(CONFIG.deprecatedTokens)) {
      const regex = new RegExp(`var\\(${token}\\)`, "g");
      let match;
      
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          results.deprecations.push({
            line: index + 1,
            column: line.indexOf(token) + 1,
            token,
            replacement: info.replacement,
            reason: info.reason,
            message: `Deprecated token "${token}". Use "${info.replacement}" instead. (${info.reason})`,
          });
        }
        regex.lastIndex = 0; // Reset regex
      });
    }
  }

  // Check for forbidden patterns
  let inMultilineComment = false;
  for (const rule of CONFIG.forbiddenPatterns) {
    inMultilineComment = false;
    lines.forEach((line, index) => {
      // Track multiline comments
      if (line.includes("/*")) {inMultilineComment = true;}
      if (line.includes("*/")) {
        inMultilineComment = false;
        return; // Skip comment closing line
      }
      if (inMultilineComment) {return;}
      
      // Skip lines that are single-line comments
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*")) {
        return;
      }
      if (rule.pattern.test(line)) {
        const result = {
          line: index + 1,
          message: rule.message,
          rule: rule.rule,
        };
        if (rule.severity === "error") {
          results.errors.push(result);
        } else {
          results.warnings.push(result);
        }
      }
      rule.pattern.lastIndex = 0;
    });
  }

  // Check for hardcoded values
  for (const rule of CONFIG.hardcodedPatterns) {
    // Skip if file is in allowed list
    if (rule.allowedFiles && rule.allowedFiles.some((f) => filePath.includes(f))) {
      continue;
    }
    // Skip if rule is relaxed for this file
    if (rule.pattern.toString().includes("#") && relaxedRules.includes("hardcodedHex")) {
      continue;
    }
    // Skip hardcoded font-size checks for mobile files (iOS zoom prevention)
    if (rule.message.includes("font-size") && relaxedRules.includes("hardcodedFontSize")) {
      continue;
    }
    // Skip hardcoded spacing checks for exception files
    if ((rule.message.includes("padding") || rule.message.includes("margin") || rule.message.includes("gap")) && relaxedRules.includes("hardcodedSpacing")) {
      continue;
    }
    // Skip hardcoded z-index checks for exception files
    if (rule.message.includes("z-index") && relaxedRules.includes("hardcodedZIndex")) {
      continue;
    }

    lines.forEach((line, index) => {
      // Skip lines that are comments
      if (line.trim().startsWith("//") || line.trim().startsWith("/*")) {
        return;
      }
      // Skip lines with exception comments or intentional hardcoded values
      if (line.includes("EXCEPTION") || line.includes("@deprecated") || line.includes("Intentionally") || line.includes("intentionally")) {
        return;
      }
      // Skip var() fallback values (these are acceptable)
      if (rule.pattern.toString().includes("#") && /var\([^,]+,\s*#/.test(line)) {
        return;
      }

      if (rule.pattern.test(line)) {
        results.warnings.push({
          line: index + 1,
          message: rule.message,
          rule: rule.rule,
        });
      }
      rule.pattern.lastIndex = 0;
    });
  }

  return results;
}

async function lintDirectory(targetPath) {
  const pattern = path.join(targetPath, "**/*.{scss,css}");
  const files = await glob(pattern, {
    ignore: CONFIG.ignorePatterns,
  });

  const allResults = {
    files: {},
    totalErrors: 0,
    totalWarnings: 0,
    totalDeprecations: 0,
    filesWithIssues: 0,
  };

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const results = lintFile(file, content);

      const hasIssues =
        results.errors.length > 0 ||
        results.warnings.length > 0 ||
        results.deprecations.length > 0;

      if (hasIssues) {
        allResults.files[file] = results;
        allResults.totalErrors += results.errors.length;
        allResults.totalWarnings += results.warnings.length;
        allResults.totalDeprecations += results.deprecations.length;
        allResults.filesWithIssues++;
      }
    } catch (err) {
      console.error(`${colors.red}Error reading ${file}:${colors.reset}`, err.message);
    }
  }

  return allResults;
}

function printResults(results) {
  console.log("");
  console.log("=".repeat(60));
  console.log(`${colors.bold}🎨 Design Token Linting Results${colors.reset}`);
  console.log("=".repeat(60));
  console.log("");

  if (Object.keys(results.files).length === 0) {
    console.log(`${colors.green}✅ No issues found!${colors.reset}`);
    console.log("");
    return;
  }

  for (const [file, fileResults] of Object.entries(results.files)) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`${colors.cyan}${colors.bold}${relativePath}${colors.reset}`);

    // Print errors
    for (const error of fileResults.errors) {
      console.log(
        `  ${colors.red}✖ ERROR${colors.reset} (line ${error.line}): ${error.message}`
      );
      if (error.rule) {
        console.log(`    ${colors.dim}Rule: ${error.rule}${colors.reset}`);
      }
    }

    // Print deprecations
    for (const dep of fileResults.deprecations) {
      console.log(
        `  ${colors.yellow}⚠ DEPRECATED${colors.reset} (line ${dep.line}): ${dep.message}`
      );
      console.log(
        `    ${colors.dim}Replace: var(${dep.token}) → var(${dep.replacement})${colors.reset}`
      );
    }

    // Print warnings
    for (const warning of fileResults.warnings) {
      console.log(
        `  ${colors.yellow}⚠ WARNING${colors.reset} (line ${warning.line}): ${warning.message}`
      );
      if (warning.rule) {
        console.log(`    ${colors.dim}Rule: ${warning.rule}${colors.reset}`);
      }
    }

    console.log("");
  }

  // Summary
  console.log("=".repeat(60));
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log("=".repeat(60));
  console.log(`Files with issues: ${results.filesWithIssues}`);
  console.log(
    `${colors.red}Errors: ${results.totalErrors}${colors.reset}`
  );
  console.log(
    `${colors.yellow}Deprecations: ${results.totalDeprecations}${colors.reset}`
  );
  console.log(
    `${colors.yellow}Warnings: ${results.totalWarnings}${colors.reset}`
  );
  console.log("");

  if (results.totalDeprecations > 0) {
    console.log(`${colors.cyan}💡 Migration Guide:${colors.reset}`);
    console.log("   See docs/DESIGN_TOKENS_AUDIT.md section 3.7 for deprecated token replacements.");
    console.log("");
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  const args = process.argv.slice(2);
  const isCI = args.includes("--ci");
  const isFix = args.includes("--fix");
  const targetPath = args.find((a) => !a.startsWith("--")) || "angular/src";

  console.log("");
  console.log(`${colors.bold}🔍 Design Token Linter${colors.reset}`);
  console.log(`${colors.dim}Scanning: ${targetPath}${colors.reset}`);
  if (isCI) {console.log(`${colors.dim}Mode: CI (strict)${colors.reset}`);}
  if (isFix) {console.log(`${colors.dim}Mode: Auto-fix (experimental)${colors.reset}`);}

  const results = await lintDirectory(targetPath);
  printResults(results);

  // Exit code logic
  if (isCI) {
    // In CI mode, exit 1 on any errors or deprecations
    if (results.totalErrors > 0 || results.totalDeprecations > 0) {
      console.log(`${colors.red}❌ CI check failed. Fix errors and deprecations before merging.${colors.reset}`);
      process.exit(1);
    }
  } else {
    // In normal mode, only exit 1 on errors
    if (results.totalErrors > 0) {
      process.exit(1);
    }
  }

  console.log(`${colors.green}✅ Design token linting complete.${colors.reset}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
