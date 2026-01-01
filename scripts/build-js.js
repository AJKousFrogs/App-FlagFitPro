#!/usr/bin/env node

/**
 * JavaScript build script using esbuild
 * Bundles and minifies JavaScript files for production
 *
 * Usage: node scripts/build-js.js [--watch] [--analyze]
 */

import { build } from "esbuild";
import { readdir, stat } from "fs/promises";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const srcDir = join(rootDir, "src");

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const analyze = args.includes("--analyze");

const buildOptions = {
  bundle: true,
  minify: !watch,
  sourcemap: watch ? "inline" : true,
  target: "es2022",
  format: "esm",
  platform: "browser",
  logLevel: "info",
  treeShaking: true,
  legalComments: "none",
  metafile: analyze,
};

async function findJSFiles(dir, fileList = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);

    if (
      fileStat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules"
    ) {
      await findJSFiles(filePath, fileList);
    } else if (
      extname(file) === ".js" &&
      !file.includes(".test.") &&
      !file.includes(".spec.")
    ) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function buildJS() {
  console.log("🔨 Building JavaScript files...\n");

  try {
    const jsFiles = await findJSFiles(srcDir);

    if (jsFiles.length === 0) {
      console.log("⚠️  No JavaScript files found in src/");
      return;
    }

    if (watch) {
      // Watch mode - build all files and watch for changes
      const context = await build({
        ...buildOptions,
        entryPoints: jsFiles,
        outdir: join(distDir, "js"),
        outExtension: { ".js": ".min.js" },
        watch: {
          onRebuild(error, _result) {
            if (error) {
              console.error("❌ Rebuild failed:", error);
            } else {
              console.log("✅ Rebuild succeeded");
            }
          },
        },
      });

      console.log("\n👀 Watching for changes... (Press Ctrl+C to stop)");

      // Keep the process running
      process.on("SIGINT", async () => {
        await context.dispose();
        process.exit(0);
      });
    } else {
      // One-time build
      const builds = jsFiles.map(async (entryPoint) => {
        const relativePath = entryPoint.replace(`${srcDir}/`, "");
        const outputPath = join(
          distDir,
          "js",
          relativePath.replace(".js", ".min.js"),
        );

        const result = await build({
          ...buildOptions,
          entryPoints: [entryPoint],
          outfile: outputPath,
        });

        if (analyze && result.metafile) {
          try {
            const { default: visualizer } = await import("esbuild-visualizer");
            await visualizer(result.metafile, {
              filename: join(distDir, "js", "bundle-analysis.html"),
              open: true,
            });
          } catch (error) {
            console.warn("⚠️  Bundle analysis skipped:", error.message);
          }
        }

        console.log(
          `✅ Built: ${relativePath} → ${outputPath.replace(`${rootDir}/`, "")}`,
        );
      });

      await Promise.all(builds);
      console.log("\n✨ JavaScript build completed!");
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

buildJS();
