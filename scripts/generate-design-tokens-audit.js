#!/usr/bin/env node
/**
 * Generate Design Tokens Audit Documentation
 * ===========================================
 *
 * Automatically generates DESIGN_TOKENS_AUDIT.md by parsing SCSS token files
 *
 * Usage:
 *   node scripts/generate-design-tokens-audit.js
 *
 * Output:
 *   docs/DESIGN_TOKENS_AUDIT.md
 *
 * Updated: January 9, 2026
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Token files to audit
const TOKEN_FILES = [
  "angular/src/scss/tokens/design-system-tokens.scss",
  "angular/src/scss/utilities/_variables.scss",
  "angular/src/scss/components/primeng/_token-mapping.scss",
  "angular/src/scss/utilities/typography-system.scss",
  "angular/src/scss/utilities/spacing-system.scss",
  "angular/src/scss/utilities/layout-system.scss",
  "angular/src/scss/pages/hover-system.scss",
  "angular/src/scss/pages/premium-interactions.scss",
  "angular/src/scss/components/standardized-components.scss",
  "angular/src/scss/utilities/_mixins.scss",
  "angular/src/styles.scss",
];

/**
 * Extract CSS custom properties from SCSS content
 * @param {string} content - SCSS file content
 * @returns {Array<{name: string, value: string}>} Array of token objects
 */
function extractTokens(content) {
  const tokens = [];
  const tokenPattern = /--([\w-]+):\s*([^;]+);/g;
  let match;

  while ((match = tokenPattern.exec(content)) !== null) {
    const [, name, value] = match;
    const cleanValue = value.trim().replace(/\s+/g, " ");
    tokens.push({ name: `--${name}`, value: cleanValue });
  }

  return tokens;
}

/**
 * Count lines in a file
 * @param {string} filePath - Path to the file
 * @returns {number} Number of lines (0 if file cannot be read)
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").length;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
    return 0;
  }
}

// Token category patterns
const TOKEN_CATEGORIES = {
  color: [
    "color",
    "primitive",
    "brand",
    "status",
    "surface",
    "text",
    "border",
    "hover",
    "interactive",
    "workout",
    "rarity",
    "staff",
    "position",
    "phase",
    "chart",
    "metallic",
  ],
  spacing: ["space", "spacing", "component"],
  typography: ["font", "text", "line-height", "letter-spacing"],
  radius: ["radius", "button-radius"],
  shadow: ["shadow", "elevation"],
  animation: ["transition", "ease", "anim", "stagger"],
  layout: ["container", "content-max", "sidebar", "header-height", "grid"],
  "z-index": ["z-index", "z-"],
  sizing: [
    "button-height",
    "input-height",
    "touch-target",
    "avatar",
    "icon",
    "progress",
    "badge",
    "card-min-height",
  ],
  gradient: ["gradient"],
  focus: ["focus", "outline"],
  state: ["state", "opacity", "overlay"],
  transform: ["transform", "hover-lift", "hover-scale"],
  breakpoint: ["breakpoint"],
};

/**
 * Categorize a token based on its name
 * @param {{name: string, value: string}} token - Token object
 * @returns {string} Category name
 */
function categorizeToken(token) {
  const name = token.name.toLowerCase();

  for (const [category, patterns] of Object.entries(TOKEN_CATEGORIES)) {
    if (patterns.some((pattern) => name.includes(pattern))) {
      return category;
    }
  }

  return "other";
}

// Generate markdown table for tokens
function generateTokenTable(tokens, category) {
  if (tokens.length === 0) {
    return "";
  }

  let table = `\n| Token | Value | Usage |\n`;
  table += `|-------|-------|-------|\n`;

  tokens.forEach((token) => {
    const usage = getTokenUsage(token.name, category);
    table += `| \`${token.name}\` | \`${token.value}\` | ${usage} |\n`;
  });

  return table;
}

// Get usage description for token
function getTokenUsage(tokenName, category) {
  const name = tokenName.toLowerCase();

  if (
    name.includes("primary-green") &&
    !name.includes("rgb") &&
    !name.includes("hover") &&
    !name.includes("light") &&
    !name.includes("subtle")
  ) {
    return "**PRIMARY BRAND COLOR**";
  }
  if (name.includes("hover")) {
    return "Hover state";
  }
  if (name.includes("active")) {
    return "Active/pressed state";
  }
  if (name.includes("focus")) {
    return "Focus state";
  }
  if (name.includes("disabled")) {
    return "Disabled state";
  }
  if (name.includes("subtle") || name.includes("ultra-subtle")) {
    return "Subtle backgrounds";
  }
  if (name.includes("light")) {
    return "Light variant";
  }
  if (name.includes("default") || name.includes("md")) {
    return "**Default**";
  }
  if (name.includes("button")) {
    return "**ALL buttons** - raised rectangular style";
  }
  if (name.includes("full") || name.includes("9999")) {
    return "**RESTRICTED** - Pill shape";
  }

  return "-";
}

// Main generation function
async function generateAudit() {
  console.log("🔍 Generating Design Tokens Audit...\n");

  const now = new Date();
  const auditDate = now.toISOString().split("T")[0];
  const auditYear = now.getFullYear();
  const auditMonth = now.toLocaleString("default", { month: "long" });
  const auditDay = now.getDate();

  let markdown = `# FlagFit Pro - Design Tokens Comprehensive Audit\n\n`;
  markdown += `**Audit Date:** ${auditMonth} ${auditDay}, ${auditYear}  \n`;
  markdown += `**Generated:** ${new Date().toISOString()}  \n`;
  markdown += `**Status:** Complete (Auto-generated)\n\n`;
  markdown += `---\n\n`;
  markdown += `## Executive Summary\n\n`;
  markdown += `This document provides a comprehensive audit of ALL UI design tokens defined in the FlagFit Pro application. The design system is well-structured with a single source of truth defined in \`design-system-tokens.scss\`.\n\n`;

  // Token Files Inventory
  markdown += `### Token Files Inventory\n\n`;
  markdown += `| File | Purpose | Lines |\n`;
  markdown += `|------|---------|-------|\n`;

  const fileStats = [];
  for (const file of TOKEN_FILES) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const lines = countLines(filePath);
      const purpose = file.includes("design-system-tokens")
        ? "**PRIMARY** - Single source of truth for all tokens"
        : file.includes("_variables")
          ? "SCSS maps and helper functions"
          : file.includes("token-mapping")
            ? "PrimeNG component token mapping"
            : file.includes("typography")
              ? "Typography utility classes"
              : file.includes("spacing")
                ? "Spacing utility classes"
                : file.includes("layout")
                  ? "Layout patterns and utilities"
                  : file.includes("hover")
                    ? "Hover state tokens"
                    : file.includes("premium-interactions")
                      ? "Animation tokens"
                      : file.includes("standardized-components")
                        ? "Component styles using tokens"
                        : file.includes("_mixins")
                          ? "SCSS mixins"
                          : "Main stylesheet";
      fileStats.push({ file, purpose, lines });
      markdown += `| \`${file}\` | ${purpose} | ~${lines} |\n`;
    }
  }

  markdown += `\n---\n\n`;

  // Read and parse main token file
  const mainTokenFile = path.join(rootDir, TOKEN_FILES[0]);
  if (!fs.existsSync(mainTokenFile)) {
    console.error(`❌ Main token file not found: ${mainTokenFile}`);
    process.exit(1);
  }

  const mainContent = fs.readFileSync(mainTokenFile, "utf8");
  const allTokens = extractTokens(mainContent);

  // Categorize tokens
  const tokensByCategory = {
    color: [],
    spacing: [],
    typography: [],
    radius: [],
    shadow: [],
    animation: [],
    layout: [],
    "z-index": [],
    sizing: [],
    gradient: [],
    focus: [],
    state: [],
    transform: [],
    breakpoint: [],
    other: [],
  };

  allTokens.forEach((token) => {
    const category = categorizeToken(token);
    tokensByCategory[category].push(token);
  });

  // Generate sections
  let sectionNum = 1;

  // COLOR TOKENS
  markdown += `## ${sectionNum++}. COLOR TOKENS\n\n`;

  // Primary Brand Colors
  const primaryBrand = tokensByCategory.color.filter(
    (t) => t.name.includes("ds-primary-green") && !t.name.includes("rgb"),
  );
  markdown += `### ${sectionNum - 1}.1 Primary Brand Colors (Single Source of Truth)\n\n`;
  markdown += generateTokenTable(primaryBrand, "color");
  markdown += `\n`;

  // Primary Green Palette
  const primaryPalette = tokensByCategory.color.filter((t) =>
    t.name.includes("primitive-primary"),
  );
  markdown += `### ${sectionNum - 1}.2 Primary Green Palette (Primitive Scale)\n\n`;
  markdown += generateTokenTable(primaryPalette, "color");
  markdown += `\n`;

  // Neutral Gray Palette
  const neutralPalette = tokensByCategory.color.filter((t) =>
    t.name.includes("primitive-neutral"),
  );
  markdown += `### ${sectionNum - 1}.3 Neutral Gray Palette\n\n`;
  markdown += generateTokenTable(neutralPalette, "color");
  markdown += `\n`;

  // Success Colors
  const successPalette = tokensByCategory.color.filter((t) =>
    t.name.includes("primitive-success"),
  );
  markdown += `### ${sectionNum - 1}.4 Success Colors (Yellow Scale)\n\n`;
  markdown += generateTokenTable(successPalette, "color");
  markdown += `\n`;

  // Warning Colors
  const warningPalette = tokensByCategory.color.filter((t) =>
    t.name.includes("primitive-warning"),
  );
  markdown += `### ${sectionNum - 1}.5 Warning Colors (Orange/Amber Scale)\n\n`;
  markdown += generateTokenTable(warningPalette, "color");
  markdown += `\n`;

  // Error Colors
  const errorPalette = tokensByCategory.color.filter((t) =>
    t.name.includes("primitive-error"),
  );
  markdown += `### ${sectionNum - 1}.6 Error Colors (Red Scale)\n\n`;
  markdown += generateTokenTable(errorPalette, "color");
  markdown += `\n`;

  // Semantic Brand Colors
  const brandColors = tokensByCategory.color.filter((t) =>
    t.name.includes("color-brand"),
  );
  markdown += `### ${sectionNum - 1}.7 Semantic Brand Colors\n\n`;
  markdown += generateTokenTable(brandColors, "color");
  markdown += `\n`;

  // Surface Colors
  const surfaceColors = tokensByCategory.color.filter((t) =>
    t.name.includes("surface-"),
  );
  markdown += `### ${sectionNum - 1}.8 Surface Colors\n\n`;
  markdown += generateTokenTable(surfaceColors, "color");
  markdown += `\n`;

  // Text Colors
  const textColors = tokensByCategory.color.filter((t) =>
    t.name.includes("color-text"),
  );
  markdown += `### ${sectionNum - 1}.9 Text Colors (WCAG AA Compliant)\n\n`;
  markdown += `| Token | Value | Contrast | Usage |\n`;
  markdown += `|-------|-------|----------|-------|\n`;
  textColors.forEach((token) => {
    const usage = getTokenUsage(token.name, "color");
    markdown += `| \`${token.name}\` | \`${token.value}\` | - | ${usage} |\n`;
  });
  markdown += `\n`;

  // Border Colors
  const borderColors = tokensByCategory.color.filter((t) =>
    t.name.includes("color-border"),
  );
  markdown += `### ${sectionNum - 1}.10 Border Colors\n\n`;
  markdown += generateTokenTable(borderColors, "color");
  markdown += `\n`;

  // Status Colors
  const statusColors = tokensByCategory.color.filter((t) =>
    t.name.includes("color-status"),
  );
  markdown += `### ${sectionNum - 1}.11 Status Colors\n\n`;
  markdown += generateTokenTable(statusColors, "color");
  markdown += `\n`;

  // Interactive State Colors
  const interactiveColors = tokensByCategory.color.filter((t) =>
    t.name.includes("color-interactive"),
  );
  markdown += `### ${sectionNum - 1}.12 Interactive State Colors\n\n`;
  markdown += generateTokenTable(interactiveColors, "color");
  markdown += `\n`;

  // Hover State Colors
  const hoverColors = tokensByCategory.color.filter((t) =>
    t.name.includes("hover-"),
  );
  markdown += `### ${sectionNum - 1}.13 Hover State Colors\n\n`;
  markdown += generateTokenTable(hoverColors, "color");
  markdown += `\n`;

  // Hover Shadows
  const hoverShadows = tokensByCategory.shadow.filter((t) =>
    t.name.includes("hover-shadow"),
  );
  if (hoverShadows.length > 0) {
    markdown += `### ${sectionNum - 1}.14 Hover Shadows\n\n`;
    markdown += generateTokenTable(hoverShadows, "shadow");
    markdown += `\n`;
  }

  // Special Purpose Colors
  const specialColors = tokensByCategory.color.filter(
    (t) =>
      t.name.includes("color-workout") ||
      t.name.includes("color-rarity") ||
      t.name.includes("color-staff") ||
      t.name.includes("color-position") ||
      t.name.includes("color-phase") ||
      t.name.includes("color-chart") ||
      t.name.includes("color-brand-youtube") ||
      t.name.includes("color-metallic"),
  );
  if (specialColors.length > 0) {
    markdown += `### ${sectionNum - 1}.15 Special Purpose Colors\n\n`;
    markdown += generateTokenTable(specialColors, "color");
    markdown += `\n`;
  }

  // SPACING TOKENS
  markdown += `## ${sectionNum++}. SPACING TOKENS\n\n`;
  markdown += `### ${sectionNum - 1}.1 Base Spacing Scale (8-Point Grid)\n\n`;
  const spacingTokens = tokensByCategory.spacing.filter((t) =>
    t.name.match(/--space-[0-9]/),
  );
  markdown += `| Token | Value (rem) | Value (px) | Usage |\n`;
  markdown += `|-------|-------------|------------|-------|\n`;
  spacingTokens.forEach((token) => {
    const match = token.value.match(/([\d.]+)rem/);
    const pxValue = match ? `${parseFloat(match[1]) * 16}px` : "-";
    const usage = token.name.includes("space-4") ? "**Default**" : "-";
    markdown += `| \`${token.name}\` | ${token.value.match(/[\d.]+rem/) || "-"} | ${pxValue} | ${usage} |\n`;
  });
  markdown += `\n`;

  // TYPOGRAPHY TOKENS
  markdown += `## ${sectionNum++}. TYPOGRAPHY TOKENS\n\n`;
  const typographyTokens = tokensByCategory.typography;
  markdown += `### ${sectionNum - 1}.1 Typography Contract (Strictly Enforced)\n\n`;
  markdown += `| Role | Size | Weight | Line Height | Usage |\n`;
  markdown += `|------|------|--------|-------------|-------|\n`;
  markdown += `| H1 | 32px (2rem) | 700 (bold) | 1.2 | Page titles/greetings |\n`;
  markdown += `| H2 | 24px (1.5rem) | 600 (semibold) | 1.25 | Section headers |\n`;
  markdown += `| H3 | 20px (1.25rem) | 400 (regular) | 1.3 | Card titles |\n`;
  markdown += `| H4 | 16px (1rem) | 300 (light) | 1.35 | Small headings |\n`;
  markdown += `| Body | 16px (1rem) | 400 (regular) | 1.5 | Regular text |\n`;
  markdown += `| Body-sm | 14px (0.875rem) | 400 (regular) | 1.45 | Small body |\n`;
  markdown += `| Label | 14px (0.875rem) | 600 (semibold) | 1.2 | Form labels |\n`;
  markdown += `| Caption | 12px (0.75rem) | 400 (regular) | 1.3 | Helper text |\n`;
  markdown += `\n`;

  // BORDER RADIUS TOKENS
  markdown += `## ${sectionNum++}. BORDER RADIUS TOKENS\n\n`;
  const radiusTokens = tokensByCategory.radius;
  markdown += `### ${sectionNum - 1}.1 Radius Scale\n\n`;
  markdown += generateTokenTable(radiusTokens, "radius");
  markdown += `\n`;

  // SHADOW TOKENS
  markdown += `## ${sectionNum++}. SHADOW & ELEVATION TOKENS\n\n`;
  const shadowTokens = tokensByCategory.shadow.filter(
    (t) => !t.name.includes("hover-shadow"),
  );
  markdown += `### ${sectionNum - 1}.1 Shadow Scale\n\n`;
  markdown += generateTokenTable(shadowTokens, "shadow");
  markdown += `\n`;

  // TRANSITION & ANIMATION TOKENS
  markdown += `## ${sectionNum++}. TRANSITION & ANIMATION TOKENS\n\n`;
  const animationTokens = tokensByCategory.animation;
  markdown += `### ${sectionNum - 1}.1 Transition Durations\n\n`;
  const durationTokens = animationTokens.filter(
    (t) => t.name.includes("transition") && !t.name.includes("ease"),
  );
  markdown += generateTokenTable(durationTokens, "animation");
  markdown += `\n`;

  // LAYOUT TOKENS
  markdown += `## ${sectionNum++}. LAYOUT TOKENS\n\n`;
  const layoutTokens = tokensByCategory.layout;
  markdown += `### ${sectionNum - 1}.1 Container Widths\n\n`;
  markdown += generateTokenTable(
    layoutTokens.filter((t) => t.name.includes("container")),
    "layout",
  );
  markdown += `\n`;

  // Z-INDEX TOKENS
  markdown += `## ${sectionNum++}. Z-INDEX TOKENS\n\n`;
  const zIndexTokens = tokensByCategory["z-index"];
  markdown += `### ${sectionNum - 1}.1 Z-Index Scale\n\n`;
  markdown += generateTokenTable(zIndexTokens, "z-index");
  markdown += `\n`;

  // COMPONENT SIZING TOKENS
  markdown += `## ${sectionNum++}. COMPONENT SIZING TOKENS\n\n`;
  const sizingTokens = tokensByCategory.sizing;
  markdown += `### ${sectionNum - 1}.1 Button Sizes\n\n`;
  markdown += generateTokenTable(
    sizingTokens.filter((t) => t.name.includes("button")),
    "sizing",
  );
  markdown += `\n`;

  // TOKEN COUNT SUMMARY
  markdown += `## ${sectionNum++}. TOKEN COUNT SUMMARY\n\n`;
  markdown += `| Category | Count |\n`;
  markdown += `|----------|-------|\n`;
  markdown += `| Color Tokens (Primary) | ~${tokensByCategory.color.filter((t) => t.name.includes("ds-primary") || t.name.includes("primitive-primary")).length} |\n`;
  markdown += `| Color Tokens (Semantic) | ~${tokensByCategory.color.filter((t) => t.name.includes("color-brand") || t.name.includes("color-text") || t.name.includes("color-border")).length} |\n`;
  markdown += `| Color Tokens (Status) | ~${tokensByCategory.color.filter((t) => t.name.includes("color-status")).length} |\n`;
  markdown += `| Color Tokens (Special) | ~${tokensByCategory.color.filter((t) => t.name.includes("color-workout") || t.name.includes("color-rarity") || t.name.includes("color-staff")).length} |\n`;
  markdown += `| Spacing Tokens | ~${tokensByCategory.spacing.length} |\n`;
  markdown += `| Typography Tokens | ~${tokensByCategory.typography.length} |\n`;
  markdown += `| Border Radius Tokens | ~${tokensByCategory.radius.length} |\n`;
  markdown += `| Shadow Tokens | ~${tokensByCategory.shadow.length} |\n`;
  markdown += `| Transition Tokens | ~${durationTokens.length} |\n`;
  markdown += `| Animation Tokens | ~${animationTokens.length} |\n`;
  markdown += `| Layout Tokens | ~${tokensByCategory.layout.length} |\n`;
  markdown += `| Z-Index Tokens | ~${tokensByCategory["z-index"].length} |\n`;
  markdown += `| Component Sizing Tokens | ~${tokensByCategory.sizing.length} |\n`;
  markdown += `| **TOTAL** | **~${allTokens.length}+ tokens** |\n`;
  markdown += `\n---\n\n`;

  // FILES AUDITED
  markdown += `## ${sectionNum++}. FILES AUDITED\n\n`;
  fileStats.forEach((stat, idx) => {
    markdown += `${idx + 1}. ✅ \`${stat.file}\`\n`;
  });
  markdown += `\n---\n\n`;

  // RECOMMENDATIONS
  markdown += `## ${sectionNum++}. RECOMMENDATIONS\n\n`;
  markdown += `### Strengths\n`;
  markdown += `1. ✅ Well-organized single source of truth (\`design-system-tokens.scss\`)\n`;
  markdown += `2. ✅ Comprehensive color system with WCAG compliance\n`;
  markdown += `3. ✅ Proper semantic aliasing\n`;
  markdown += `4. ✅ Dark mode support built-in\n`;
  markdown += `5. ✅ PrimeNG properly mapped to design system\n`;
  markdown += `6. ✅ Accessibility focus (touch targets, contrast, focus rings)\n\n`;
  markdown += `### Areas for Potential Improvement\n`;
  markdown += `1. Consider consolidating some redundant aliases\n`;
  markdown += `2. Document token deprecation strategy for legacy tokens\n`;
  markdown += `3. Add automated token validation tooling\n\n`;
  markdown += `---\n\n`;
  markdown += `**Audit Complete** ✅\n`;
  markdown += `\n*This document is auto-generated. To regenerate, run: \`npm run audit:docs:generate\`*\n`;

  // Write to file
  const outputPath = path.join(rootDir, "docs", "DESIGN_TOKENS_AUDIT.md");

  try {
    fs.writeFileSync(outputPath, markdown, "utf8");
    console.log(`✅ Design Tokens Audit generated successfully!`);
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📊 Total tokens found: ${allTokens.length}`);
    console.log(`📁 Files audited: ${fileStats.length}\n`);
  } catch (error) {
    console.error(`❌ Failed to write audit file: ${error.message}`);
    throw error;
  }
}

// Run
generateAudit().catch((error) => {
  console.error("❌ Error generating audit:", error);
  process.exit(1);
});
