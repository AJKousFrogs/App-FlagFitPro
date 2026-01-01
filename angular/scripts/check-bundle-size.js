#!/usr/bin/env node
/**
 * Bundle Size Checker
 *
 * Analyzes the production build output and reports bundle sizes.
 * Useful for tracking bundle size changes over time.
 *
 * Usage: node scripts/check-bundle-size.js
 */

const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "../dist/flagfit-pro/browser");
const SIZE_LIMITS = {
  // Main bundle limits (in KB)
  main: 500,
  polyfills: 50,
  styles: 100,
  // Chunk limits
  chunk: 350,
};

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function categorizeFile(filename) {
  if (filename.startsWith("main")) return "main";
  if (filename.startsWith("polyfills")) return "polyfills";
  if (filename.startsWith("styles")) return "styles";
  if (filename.startsWith("chunk-")) return "chunk";
  return "other";
}

function checkBundleSizes() {
  console.log(
    `${COLORS.bold}${COLORS.cyan}📦 FlagFit Pro Bundle Size Report${COLORS.reset}\n`,
  );

  if (!fs.existsSync(DIST_DIR)) {
    console.log(
      `${COLORS.red}❌ Build directory not found: ${DIST_DIR}${COLORS.reset}`,
    );
    console.log(`${COLORS.yellow}   Run 'npm run build' first.${COLORS.reset}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_DIR);
  const jsFiles = files.filter((f) => f.endsWith(".js"));
  const cssFiles = files.filter((f) => f.endsWith(".css"));

  let totalJsSize = 0;
  let totalCssSize = 0;
  let warnings = [];
  let errors = [];

  // Analyze JS files
  console.log(`${COLORS.bold}JavaScript Bundles:${COLORS.reset}`);
  console.log("─".repeat(60));

  const jsBundles = jsFiles
    .map((file) => {
      const filePath = path.join(DIST_DIR, file);
      const size = getFileSize(filePath);
      const sizeKb = size / 1024;
      const category = categorizeFile(file);
      totalJsSize += size;

      return { file, size, sizeKb, category };
    })
    .sort((a, b) => b.size - a.size);

  jsBundles.forEach(({ file, size, sizeKb, category }) => {
    const limit = SIZE_LIMITS[category] || SIZE_LIMITS.chunk;
    let status = COLORS.green + "✓" + COLORS.reset;

    if (sizeKb > limit) {
      status = COLORS.red + "✗" + COLORS.reset;
      errors.push(`${file} exceeds ${limit}KB limit (${formatSize(size)})`);
    } else if (sizeKb > limit * 0.8) {
      status = COLORS.yellow + "⚠" + COLORS.reset;
      warnings.push(
        `${file} approaching ${limit}KB limit (${formatSize(size)})`,
      );
    }

    console.log(
      `  ${status} ${file.padEnd(40)} ${formatSize(size).padStart(12)}`,
    );
  });

  // Analyze CSS files
  console.log(`\n${COLORS.bold}CSS Bundles:${COLORS.reset}`);
  console.log("─".repeat(60));

  cssFiles.forEach((file) => {
    const filePath = path.join(DIST_DIR, file);
    const size = getFileSize(filePath);
    totalCssSize += size;
    console.log(
      `  ${COLORS.green}✓${COLORS.reset} ${file.padEnd(40)} ${formatSize(size).padStart(12)}`,
    );
  });

  // Summary
  console.log(`\n${COLORS.bold}Summary:${COLORS.reset}`);
  console.log("─".repeat(60));
  console.log(`  Total JavaScript: ${formatSize(totalJsSize)}`);
  console.log(`  Total CSS:        ${formatSize(totalCssSize)}`);
  console.log(`  Total Assets:     ${formatSize(totalJsSize + totalCssSize)}`);
  console.log(`  JS Files:         ${jsFiles.length}`);
  console.log(`  CSS Files:        ${cssFiles.length}`);

  // Warnings and Errors
  if (warnings.length > 0) {
    console.log(`\n${COLORS.yellow}${COLORS.bold}⚠ Warnings:${COLORS.reset}`);
    warnings.forEach((w) =>
      console.log(`  ${COLORS.yellow}• ${w}${COLORS.reset}`),
    );
  }

  if (errors.length > 0) {
    console.log(`\n${COLORS.red}${COLORS.bold}✗ Errors:${COLORS.reset}`);
    errors.forEach((e) => console.log(`  ${COLORS.red}• ${e}${COLORS.reset}`));
    console.log(`\n${COLORS.red}Bundle size check failed!${COLORS.reset}`);
    // Don't exit with error - just warn
  }

  // Performance tips
  console.log(
    `\n${COLORS.cyan}${COLORS.bold}💡 Performance Tips:${COLORS.reset}`,
  );
  if (totalJsSize > 1024 * 1024) {
    console.log(`  • Consider code splitting for large bundles`);
  }
  console.log(`  • Use @defer for below-the-fold content`);
  console.log(`  • Lazy load routes and heavy components`);
  console.log(`  • Enable gzip/brotli compression on server`);

  console.log(`\n${COLORS.green}✓ Bundle analysis complete!${COLORS.reset}\n`);
}

checkBundleSizes();
