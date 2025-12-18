#!/usr/bin/env node

/**
 * Build script for FlagFit Pro
 * Comprehensive build pipeline with CSS and JavaScript minification
 *
 * Usage: node scripts/build.js [--watch] [--analyze]
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const analyze = args.includes("--analyze");
const isProduction = process.env.NODE_ENV === "production" || !watch;

console.log(`🏗️  Building FlagFit Pro${isProduction ? " for production" : ""}...\n`);

// Generate env.js with Supabase credentials
try {
  console.log("📝 Generating env.js with Supabase credentials...");
  execSync("node generate-env.js", { stdio: "inherit", cwd: rootDir });
  console.log("✅ env.js generated\n");
} catch (error) {
  console.error("❌ Failed to generate env.js:", error.message);
  process.exit(1);
}

// Create dist directory structure
const distDirs = [distDir, join(distDir, "css"), join(distDir, "js"), join(distDir, "assets")];
distDirs.forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Build CSS
async function buildCSS() {
  console.log("🎨 Building CSS files...");
  try {
    const postcssCmd = watch
      ? "postcss src/**/*.css --dir dist/css --map --watch"
      : "postcss src/**/*.css --dir dist/css --map";
    
    if (!watch) {
      execSync(postcssCmd, { stdio: "inherit", cwd: rootDir });
      console.log("✅ CSS build completed\n");
    } else {
      console.log("👀 Watching CSS files...\n");
      execSync(postcssCmd, { stdio: "inherit", cwd: rootDir });
    }
  } catch (error) {
    console.warn("⚠️  CSS build skipped:", error.message);
  }
}

// Build JavaScript
async function buildJS() {
  console.log("📦 Building JavaScript files...");
  try {
    const buildJsCmd = watch
      ? `node scripts/build-js.js --watch${analyze ? " --analyze" : ""}`
      : `node scripts/build-js.js${analyze ? " --analyze" : ""}`;
    
    execSync(buildJsCmd, { stdio: "inherit", cwd: rootDir });
    if (!watch) {
      console.log("✅ JavaScript build completed\n");
    }
  } catch (error) {
    console.warn("⚠️  JavaScript build skipped:", error.message);
  }
}

// Copy static assets
function copyAssets() {
  console.log("📋 Copying static assets...");
  try {
    const assetsDir = join(rootDir, "src", "assets");
    if (existsSync(assetsDir)) {
      const copyRecursive = (src, dest) => {
        const entries = readdirSync(src, { withFileTypes: true });
        entries.forEach((entry) => {
          const srcPath = join(src, entry.name);
          const destPath = join(dest, entry.name);
          
          if (entry.isDirectory()) {
            if (!existsSync(destPath)) {
              mkdirSync(destPath, { recursive: true });
            }
            copyRecursive(srcPath, destPath);
          } else {
            copyFileSync(srcPath, destPath);
          }
        });
      };
      
      copyRecursive(assetsDir, join(distDir, "assets"));
      console.log("✅ Assets copied\n");
    }
  } catch (error) {
    console.warn("⚠️  Asset copy skipped:", error.message);
  }
}

// Copy HTML files (if needed)
function copyHTML() {
  console.log("📄 Copying HTML files...");
  try {
    const htmlFiles = readdirSync(rootDir).filter(
      (file) => extname(file) === ".html" && !file.startsWith(".")
    );
    
    htmlFiles.forEach((file) => {
      copyFileSync(join(rootDir, file), join(distDir, file));
    });
    
    if (htmlFiles.length > 0) {
      console.log(`✅ Copied ${htmlFiles.length} HTML file(s)\n`);
    }
  } catch (error) {
    console.warn("⚠️  HTML copy skipped:", error.message);
  }
}

// Main build function
async function main() {
  try {
    if (!watch) {
      await buildCSS();
      await buildJS();
      copyAssets();
      copyHTML();
      
      console.log("✨ Build completed successfully!");
      console.log(`📦 Output directory: ${distDir}`);
    } else {
      console.log("👀 Starting watch mode...\n");
      await Promise.all([buildCSS(), buildJS()]);
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

main();
