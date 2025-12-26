#!/usr/bin/env node

/**
 * Application Performance Health Check
 * Monitors React app performance, bundle size, and runtime metrics
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

class AppPerformanceChecker {
  constructor() {
    this.results = {
      build: { status: "unknown", size: {}, time: 0 },
      bundle: { status: "unknown", analysis: {} },
      runtime: { status: "unknown", metrics: {} },
      memory: { status: "unknown", usage: {} },
      recommendations: [],
    };
  }

  async checkBuildPerformance() {
    console.log("🔨 Checking Build Performance...");

    try {
      // Check if dist directory exists
      const distPath = join(projectRoot, "dist");
      if (!existsSync(distPath)) {
        console.log("   ℹ️  No build found, running build test...");
        await this.runBuildTest();
        return;
      }

      // Analyze build size
      const buildStats = this.analyzeBuildSize(distPath);
      this.results.build.size = buildStats;

      console.log(`   Total build size: ${buildStats.totalSize}`);
      console.log(`   JavaScript: ${buildStats.jsSize}`);
      console.log(`   CSS: ${buildStats.cssSize}`);
      console.log(`   Assets: ${buildStats.assetSize}`);

      // Check for large files
      if (buildStats.largeFiles.length > 0) {
        console.log("   ⚠️  Large files detected:");
        buildStats.largeFiles.forEach((file) => {
          console.log(`      ${file.name}: ${file.size}`);
        });
        this.results.recommendations.push(
          "Consider code splitting for large files",
        );
      }
    } catch (error) {
      console.log(`   ❌ Build check failed: ${error.message}`);
      this.results.build.status = "error";
    }
  }

  async runBuildTest() {
    const start = performance.now();

    try {
      console.log("   Building application...");
      execSync("npm run build", {
        cwd: projectRoot,
        stdio: "pipe",
        timeout: 120000, // 2 minutes
      });

      const buildTime = performance.now() - start;
      this.results.build.time = Math.round(buildTime);

      console.log(`   ✅ Build completed in ${buildTime.toFixed(0)}ms`);

      // Analyze the new build
      const distPath = join(projectRoot, "dist");
      const buildStats = this.analyzeBuildSize(distPath);
      this.results.build.size = buildStats;
    } catch (error) {
      console.log(`   ❌ Build failed: ${error.message}`);
      this.results.build.status = "error";
    }
  }

  analyzeBuildSize(distPath) {
    const stats = {
      totalSize: "0 B",
      jsSize: "0 B",
      cssSize: "0 B",
      assetSize: "0 B",
      largeFiles: [],
      fileCount: 0,
    };

    try {
      const files = this.getAllFiles(distPath);
      let totalBytes = 0;
      let jsBytes = 0;
      let cssBytes = 0;
      let assetBytes = 0;

      files.forEach((file) => {
        const filePath = join(distPath, file);
        const fileStat = statSync(filePath);
        const size = fileStat.size;
        totalBytes += size;

        if (file.endsWith(".js")) {
          jsBytes += size;
        } else if (file.endsWith(".css")) {
          cssBytes += size;
        } else {
          assetBytes += size;
        }

        // Flag large files (>500KB)
        if (size > 500 * 1024) {
          stats.largeFiles.push({
            name: file,
            size: this.formatBytes(size),
          });
        }
      });

      stats.totalSize = this.formatBytes(totalBytes);
      stats.jsSize = this.formatBytes(jsBytes);
      stats.cssSize = this.formatBytes(cssBytes);
      stats.assetSize = this.formatBytes(assetBytes);
      stats.fileCount = files.length;

      // Performance recommendations
      if (totalBytes > 5 * 1024 * 1024) {
        // >5MB
        this.results.recommendations.push(
          "Build size is large, consider optimization",
        );
      }
      if (jsBytes > 2 * 1024 * 1024) {
        // >2MB JS
        this.results.recommendations.push(
          "JavaScript bundle is large, consider code splitting",
        );
      }
    } catch (error) {
      console.log(`   Error analyzing build: ${error.message}`);
    }

    return stats;
  }

  getAllFiles(dir, files = []) {
    const items = readdirSync(dir);

    items.forEach((item) => {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(relative(dir, fullPath));
      }
    });

    return files;
  }

  formatBytes(bytes) {
    if (bytes === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async checkBundleAnalysis() {
    console.log("\n📦 Checking Bundle Analysis...");

    try {
      // Check for bundle analyzer
      const analyzerPath = join(projectRoot, "dist", "bundle-analyzer.html");
      if (existsSync(analyzerPath)) {
        console.log("   ✅ Bundle analyzer report available");
        this.results.bundle.status = "analyzed";
      } else {
        console.log("   ℹ️  No bundle analyzer report found");
        this.results.recommendations.push(
          "Run bundle analysis: npm run build:analyze",
        );
      }

      // Check for source maps
      const sourceMaps = this.findSourceMaps(join(projectRoot, "dist"));
      if (sourceMaps.length > 0) {
        console.log(`   ✅ Source maps found: ${sourceMaps.length} files`);
      } else {
        console.log("   ⚠️  No source maps found (good for production)");
      }
    } catch (error) {
      console.log(`   ❌ Bundle analysis failed: ${error.message}`);
    }
  }

  findSourceMaps(dir) {
    const sourceMaps = [];

    try {
      const files = this.getAllFiles(dir);
      files.forEach((file) => {
        if (file.endsWith(".map")) {
          sourceMaps.push(file);
        }
      });
    } catch (_error) {
      // Ignore errors
    }

    return sourceMaps;
  }

  async checkRuntimePerformance() {
    console.log("\n⚡ Checking Runtime Performance...");

    try {
      // Check if dev server is running
      const devServerRunning = await this.checkDevServer();

      if (devServerRunning) {
        console.log("   ✅ Development server is running");

        // Check HMR performance
        const hmrStatus = await this.checkHMR();
        if (hmrStatus) {
          console.log("   ✅ Hot Module Replacement is working");
        } else {
          console.log("   ⚠️  HMR might be slow or disabled");
        }

        this.results.runtime.status = "running";
      } else {
        console.log("   ℹ️  Development server not running");
        this.results.runtime.status = "stopped";
      }
    } catch (error) {
      console.log(`   ❌ Runtime check failed: ${error.message}`);
    }
  }

  async checkDevServer() {
    try {
      const response = await fetch("http://localhost:4000");
      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  async checkHMR() {
    try {
      const response = await fetch("http://localhost:4000/@vite/client");
      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  async checkMemoryUsage() {
    console.log("\n💾 Checking Memory Usage...");

    try {
      const memUsage = process.memoryUsage();

      this.results.memory.usage = {
        rss: this.formatBytes(memUsage.rss),
        heapUsed: this.formatBytes(memUsage.heapUsed),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        external: this.formatBytes(memUsage.external),
      };

      console.log(`   RSS: ${this.results.memory.usage.rss}`);
      console.log(`   Heap Used: ${this.results.memory.usage.heapUsed}`);
      console.log(`   Heap Total: ${this.results.memory.usage.heapTotal}`);
      console.log(`   External: ${this.results.memory.usage.external}`);

      // Check for memory leaks
      if (memUsage.heapUsed > 100 * 1024 * 1024) {
        // >100MB
        console.log("   ⚠️  High memory usage detected");
        this.results.recommendations.push("Consider memory optimization");
      }

      this.results.memory.status = "checked";
    } catch (error) {
      console.log(`   ❌ Memory check failed: ${error.message}`);
    }
  }

  async checkDependencies() {
    console.log("\n📚 Checking Dependencies...");

    try {
      const packageJson = JSON.parse(
        readFileSync(join(projectRoot, "package.json"), "utf8"),
      );

      // Check for duplicate dependencies
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const duplicates = this.findDuplicateDependencies(allDeps);
      if (duplicates.length > 0) {
        console.log("   ⚠️  Potential duplicate dependencies:");
        duplicates.forEach((dup) => {
          console.log(`      ${dup.name}: ${dup.versions.join(", ")}`);
        });
        this.results.recommendations.push("Resolve duplicate dependencies");
      } else {
        console.log("   ✅ No duplicate dependencies found");
      }

      // Check for outdated packages
      try {
        const outdated = execSync("npm outdated --json", {
          cwd: projectRoot,
          stdio: "pipe",
          timeout: 30000,
        }).toString();

        const outdatedData = JSON.parse(outdated);
        const outdatedCount = Object.keys(outdatedData).length;

        if (outdatedCount > 0) {
          console.log(`   ⚠️  ${outdatedCount} outdated packages found`);
          this.results.recommendations.push(
            "Update outdated packages: npm update",
          );
        } else {
          console.log("   ✅ All packages are up to date");
        }
      } catch (_error) {
        console.log("   ℹ️  Could not check for outdated packages");
      }
    } catch (error) {
      console.log(`   ❌ Dependency check failed: ${error.message}`);
    }
  }

  findDuplicateDependencies(deps) {
    const duplicates = [];
    const seen = new Map();

    Object.entries(deps).forEach(([name, version]) => {
      if (seen.has(name)) {
        const existing = duplicates.find((d) => d.name === name);
        if (existing) {
          existing.versions.push(version);
        } else {
          duplicates.push({
            name,
            versions: [seen.get(name), version],
          });
        }
      } else {
        seen.set(name, version);
      }
    });

    return duplicates;
  }

  generateReport() {
    console.log("\n📊 Application Performance Report");
    console.log("==================================");

    // Build Performance
    const build = this.results.build;
    console.log(
      `🔨 Build: ${build.status === "error" ? "❌" : "✅"} ${build.status}`,
    );
    if (build.size.totalSize) {
      console.log(`   Total size: ${build.size.totalSize}`);
      console.log(`   Files: ${build.size.fileCount}`);
      if (build.time > 0) {
        console.log(`   Build time: ${build.time}ms`);
      }
    }

    // Bundle Analysis
    const bundle = this.results.bundle;
    console.log(
      `📦 Bundle: ${bundle.status === "analyzed" ? "✅" : "ℹ️"} ${bundle.status}`,
    );

    // Runtime Performance
    const runtime = this.results.runtime;
    console.log(
      `⚡ Runtime: ${runtime.status === "running" ? "✅" : "ℹ️"} ${runtime.status}`,
    );

    // Memory Usage
    const memory = this.results.memory;
    console.log(
      `💾 Memory: ${memory.status === "checked" ? "✅" : "❌"} ${memory.status}`,
    );
    if (memory.usage.rss) {
      console.log(`   RSS: ${memory.usage.rss}`);
      console.log(`   Heap: ${memory.usage.heapUsed}`);
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log("\n💡 Performance Recommendations:");
      this.results.recommendations.forEach((rec) => {
        console.log(`   • ${rec}`);
      });
    }

    // Overall status
    const overallStatus = this.getOverallStatus();
    console.log(
      `\n🎯 Overall Status: ${overallStatus.icon} ${overallStatus.status}`,
    );
    console.log(`   ${overallStatus.description}`);
  }

  getOverallStatus() {
    const build = this.results.build.status;
    const _bundle = this.results.bundle.status;
    const _runtime = this.results.runtime.status;
    const memory = this.results.memory.status;

    if (build !== "error" && memory === "checked") {
      return {
        status: "HEALTHY",
        icon: "✅",
        description: "Application performance is good",
      };
    } else if (build === "error") {
      return {
        status: "BUILD ISSUES",
        icon: "❌",
        description: "Build process has problems",
      };
    } else {
      return {
        status: "NEEDS ATTENTION",
        icon: "⚠️",
        description: "Some performance issues detected",
      };
    }
  }

  async runAllChecks() {
    console.log("🏥 Application Performance Check Starting...\n");

    await this.checkBuildPerformance();
    await this.checkBundleAnalysis();
    await this.checkRuntimePerformance();
    await this.checkMemoryUsage();
    await this.checkDependencies();

    this.generateReport();

    return this.results;
  }
}

// CLI interface
async function main() {
  const [, , command] = process.argv;
  const checker = new AppPerformanceChecker();

  switch (command) {
    case "monitor":
      console.log(
        "🔄 Starting continuous performance monitoring (Ctrl+C to stop)...\n",
      );
      const monitor = async () => {
        console.clear();
        console.log(
          `🏈 Performance Monitor - ${new Date().toLocaleTimeString()}\n`,
        );
        await checker.runAllChecks();
      };

      await monitor();
      const interval = setInterval(monitor, 300000); // Check every 5 minutes

      process.on("SIGINT", () => {
        clearInterval(interval);
        console.log("\n👋 Performance monitoring stopped");
        process.exit(0);
      });
      break;

    case "check":
    default:
      await checker.runAllChecks();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AppPerformanceChecker;
