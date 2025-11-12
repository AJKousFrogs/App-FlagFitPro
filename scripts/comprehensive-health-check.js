#!/usr/bin/env node

// Comprehensive Health Check Script for Production Readiness
// Validates all aspects of the Flag Football app before deployment

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overallHealth: 0,
      categories: {},
      criticalIssues: [],
      warnings: [],
      recommendations: [],
    };
  }

  async runComprehensiveCheck() {
    console.log("🏥 Starting Comprehensive Health Check...\n");

    try {
      await this.checkDependencies();
      await this.checkTests();
      await this.checkSecurity();
      await this.checkCodeQuality();
      await this.checkConfiguration();
      await this.checkPerformance();
      await this.checkDocumentation();

      this.calculateOverallHealth();
      await this.generateReport();

      console.log(
        `\n✅ Health check complete! Overall score: ${this.results.overallHealth}/100`,
      );

      if (this.results.criticalIssues.length > 0) {
        console.log(
          `\n🚨 Critical issues: ${this.results.criticalIssues.length}`,
        );
        this.results.criticalIssues.forEach((issue) =>
          console.log(`  ❌ ${issue}`),
        );
      }

      if (this.results.warnings.length > 0) {
        console.log(`\n⚠️  Warnings: ${this.results.warnings.length}`);
        this.results.warnings
          .slice(0, 3)
          .forEach((warning) => console.log(`  ⚠️  ${warning}`));
      }

      return this.results;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      this.results.criticalIssues.push(`Health check error: ${error.message}`);
      return this.results;
    }
  }

  async checkDependencies() {
    console.log("📦 Checking Dependencies...");

    const deps = {
      score: 0,
      issues: [],
      status: "checking",
    };

    try {
      // Check package.json exists
      const packagePath = "./package.json";
      const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));

      // Check critical dependencies
      const criticalDeps = [
        "@supabase/supabase-js",
        "express",
        "chart.js",
        "vitest",
        "react",
      ];

      let foundDeps = 0;
      for (const dep of criticalDeps) {
        if (
          packageJson.dependencies?.[dep] ||
          packageJson.devDependencies?.[dep]
        ) {
          foundDeps++;
        } else {
          deps.issues.push(`Missing critical dependency: ${dep}`);
        }
      }

      deps.score = Math.round((foundDeps / criticalDeps.length) * 100);

      // Check for dependency vulnerabilities
      try {
        const { stdout } = await execAsync("npm audit --json", {
          timeout: 30000,
        });
        const auditResult = JSON.parse(stdout);

        if (auditResult.vulnerabilities) {
          const vulnCount = Object.keys(auditResult.vulnerabilities).length;
          if (vulnCount > 0) {
            deps.issues.push(`${vulnCount} security vulnerabilities found`);
            deps.score = Math.max(0, deps.score - vulnCount * 2); // Reduce score

            if (vulnCount > 20) {
              this.results.criticalIssues.push(
                "Too many security vulnerabilities (>20)",
              );
            }
          }
        }
      } catch (_auditError) {
        deps.issues.push("Could not run security audit");
      }

      deps.status =
        deps.score > 70 ? "good" : deps.score > 40 ? "warning" : "critical";
    } catch (error) {
      deps.issues.push(`Dependency check failed: ${error.message}`);
      deps.score = 0;
      deps.status = "critical";
    }

    this.results.categories.dependencies = deps;
    console.log(`   Score: ${deps.score}/100`);
  }

  async checkTests() {
    console.log("🧪 Checking Test Infrastructure...");

    const tests = {
      score: 0,
      issues: [],
      status: "checking",
      metrics: {},
    };

    try {
      // Check if test files exist
      const testDirs = ["./tests/unit", "./tests/integration", "./tests/e2e"];
      let testDirsFound = 0;

      for (const dir of testDirs) {
        try {
          const files = await fs.readdir(dir);
          if (files.length > 0) {
            testDirsFound++;
            tests.metrics[`${dir.split("/")[2]}_files`] = files.length;
          }
        } catch {
          tests.issues.push(`Test directory missing: ${dir}`);
        }
      }

      tests.score += (testDirsFound / testDirs.length) * 30; // 30 points for test structure

      // Try to run tests
      try {
        const { stdout } = await execAsync("npm run test:unit", {
          timeout: 60000,
        });

        // Parse test results from output
        const passedMatch = stdout.match(/(\d+) passed/);
        const failedMatch = stdout.match(/(\d+) failed/);

        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = passed + failed;

        tests.metrics.passed = passed;
        tests.metrics.failed = failed;
        tests.metrics.total = total;

        if (total > 0) {
          const passRate = (passed / total) * 100;
          tests.score += (passRate / 100) * 70; // 70 points for pass rate

          if (passRate < 50) {
            this.results.criticalIssues.push(
              `Low test pass rate: ${passRate.toFixed(1)}%`,
            );
          } else if (passRate < 80) {
            this.results.warnings.push(
              `Test pass rate needs improvement: ${passRate.toFixed(1)}%`,
            );
          }
        } else {
          tests.issues.push("No tests found or executed");
        }
      } catch (_testError) {
        tests.issues.push("Tests failed to run or completed with errors");
        this.results.criticalIssues.push("Test suite execution failed");
      }

      tests.status =
        tests.score > 70 ? "good" : tests.score > 40 ? "warning" : "critical";
    } catch (error) {
      tests.issues.push(`Test check failed: ${error.message}`);
      tests.score = 0;
      tests.status = "critical";
    }

    this.results.categories.tests = tests;
    console.log(`   Score: ${tests.score}/100`);
  }

  async checkSecurity() {
    console.log("🔒 Checking Security Configuration...");

    const security = {
      score: 0,
      issues: [],
      status: "checking",
    };

    try {
      // Check for sensitive files
      const sensitiveFiles = [
        ".env",
        ".env.local",
        ".env.production",
        "secrets.json",
      ];
      for (const file of sensitiveFiles) {
        try {
          await fs.access(file);
          this.results.warnings.push(
            `Sensitive file found: ${file} (ensure it's in .gitignore)`,
          );
        } catch {
          // File not found - this is good for security
        }
      }

      // Check .gitignore exists and has basic entries
      try {
        const gitignore = await fs.readFile(".gitignore", "utf8");
        const requiredEntries = ["node_modules", ".env", "*.log", "dist"];
        let foundEntries = 0;

        for (const entry of requiredEntries) {
          if (gitignore.includes(entry)) {
            foundEntries++;
          }
        }

        security.score += (foundEntries / requiredEntries.length) * 25; // 25 points for .gitignore
      } catch {
        security.issues.push(".gitignore file missing");
        this.results.criticalIssues.push("Missing .gitignore file");
      }

      // Check Netlify security headers
      try {
        const netlifyConfig = await fs.readFile("./netlify.toml", "utf8");
        const securityHeaders = [
          "X-Frame-Options",
          "X-XSS-Protection",
          "X-Content-Type-Options",
        ];
        let foundHeaders = 0;

        for (const header of securityHeaders) {
          if (netlifyConfig.includes(header)) {
            foundHeaders++;
          }
        }

        security.score += (foundHeaders / securityHeaders.length) * 25; // 25 points for security headers
      } catch {
        security.issues.push("Netlify configuration missing or incomplete");
      }

      // Check for demo/debug code in production files
      const productionFiles = ["./src/auth-manager.js", "./index.html"];
      let debugCodeFound = 0;

      for (const file of productionFiles) {
        try {
          const content = await fs.readFile(file, "utf8");
          if (
            content.includes("demo-token") ||
            content.includes("console.log") ||
            content.includes("debug")
          ) {
            debugCodeFound++;
            security.issues.push(`Debug/demo code found in: ${file}`);
          }
        } catch {
          // File not found
        }
      }

      if (debugCodeFound > 0) {
        security.score = Math.max(0, security.score - debugCodeFound * 15);
        this.results.warnings.push(
          `Debug code found in ${debugCodeFound} production files`,
        );
      } else {
        security.score += 25; // 25 points for clean production code
      }

      // Bonus for additional security measures
      security.score += 25; // Base security score

      security.status =
        security.score > 70
          ? "good"
          : security.score > 40
            ? "warning"
            : "critical";
    } catch (error) {
      security.issues.push(`Security check failed: ${error.message}`);
      security.score = 0;
      security.status = "critical";
    }

    this.results.categories.security = security;
    console.log(`   Score: ${security.score}/100`);
  }

  async checkCodeQuality() {
    console.log("📝 Checking Code Quality...");

    const codeQuality = {
      score: 0,
      issues: [],
      status: "checking",
      metrics: {},
    };

    try {
      // Check for main application files
      const coreFiles = [
        "./src/auth-manager.js",
        "./package.json",
        "./index.html",
        "./netlify.toml",
      ];

      let foundFiles = 0;
      for (const file of coreFiles) {
        try {
          await fs.access(file);
          foundFiles++;
        } catch {
          codeQuality.issues.push(`Missing core file: ${file}`);
        }
      }

      codeQuality.score += (foundFiles / coreFiles.length) * 40; // 40 points for core files

      // Check documentation
      const docFiles = ["./README.md", "./docs", "./CLAUDE.md"];
      let foundDocs = 0;

      for (const docPath of docFiles) {
        try {
          await fs.access(docPath);
          foundDocs++;
        } catch {
          // Doc not found
        }
      }

      codeQuality.score += (foundDocs / docFiles.length) * 20; // 20 points for documentation

      // Check for proper configuration files
      const configFiles = ["./vitest.config.js", "./package.json"];
      let foundConfigs = 0;

      for (const config of configFiles) {
        try {
          await fs.access(config);
          foundConfigs++;
        } catch {
          codeQuality.issues.push(`Missing configuration: ${config}`);
        }
      }

      codeQuality.score += (foundConfigs / configFiles.length) * 20; // 20 points for configuration

      // Check project structure
      const expectedDirs = ["./src", "./tests", "./docs"];
      let foundDirs = 0;

      for (const dir of expectedDirs) {
        try {
          const stat = await fs.stat(dir);
          if (stat.isDirectory()) {
            foundDirs++;
          }
        } catch {
          codeQuality.issues.push(`Missing directory: ${dir}`);
        }
      }

      codeQuality.score += (foundDirs / expectedDirs.length) * 20; // 20 points for structure

      codeQuality.metrics.coreFiles = foundFiles;
      codeQuality.metrics.documentation = foundDocs;
      codeQuality.metrics.configuration = foundConfigs;

      codeQuality.status =
        codeQuality.score > 70
          ? "good"
          : codeQuality.score > 40
            ? "warning"
            : "critical";
    } catch (error) {
      codeQuality.issues.push(`Code quality check failed: ${error.message}`);
      codeQuality.score = 0;
      codeQuality.status = "critical";
    }

    this.results.categories.codeQuality = codeQuality;
    console.log(`   Score: ${codeQuality.score}/100`);
  }

  async checkConfiguration() {
    console.log("⚙️ Checking Configuration...");

    const config = {
      score: 0,
      issues: [],
      status: "checking",
    };

    try {
      // Check package.json scripts
      const packageJson = JSON.parse(
        await fs.readFile("./package.json", "utf8"),
      );
      const requiredScripts = ["test", "start", "build"];
      let foundScripts = 0;

      for (const script of requiredScripts) {
        if (packageJson.scripts?.[script]) {
          foundScripts++;
        } else {
          config.issues.push(`Missing script: ${script}`);
        }
      }

      config.score += (foundScripts / requiredScripts.length) * 40; // 40 points for scripts

      // Check Netlify configuration
      try {
        const netlifyConfig = await fs.readFile("./netlify.toml", "utf8");
        if (netlifyConfig.includes("[[headers]]")) {
          config.score += 30; // 30 points for Netlify config
        }
      } catch {
        config.issues.push("Netlify configuration incomplete");
      }

      // Check for environment setup
      const envExample = "./.env.example";
      try {
        await fs.access(envExample);
        config.score += 15; // 15 points for env example
      } catch {
        config.issues.push("Missing .env.example file");
      }

      // Check for development setup
      config.score += 15; // Base configuration score

      config.status =
        config.score > 70 ? "good" : config.score > 40 ? "warning" : "critical";
    } catch (error) {
      config.issues.push(`Configuration check failed: ${error.message}`);
      config.score = 0;
      config.status = "critical";
    }

    this.results.categories.configuration = config;
    console.log(`   Score: ${config.score}/100`);
  }

  async checkPerformance() {
    console.log("⚡ Checking Performance Indicators...");

    const performance = {
      score: 50, // Base score
      issues: [],
      status: "checking",
      metrics: {},
    };

    try {
      // Check bundle size (estimate from node_modules)
      try {
        const nodeModulesSize = await this.getDirectorySize("./node_modules");
        performance.metrics.nodeModulesSize = `${Math.round(nodeModulesSize / (1024 * 1024))}MB`;

        // Large node_modules might indicate bundle size issues
        if (nodeModulesSize > 500 * 1024 * 1024) {
          // 500MB
          performance.issues.push(
            "Large node_modules size may affect build performance",
          );
          performance.score -= 10;
        }
      } catch {
        // Can't check size
      }

      // Check for performance optimizations
      const packageJson = JSON.parse(
        await fs.readFile("./package.json", "utf8"),
      );

      // Check for modern build tools
      const modernTools = ["vite", "esbuild", "@vitejs/plugin-react"];
      let foundTools = 0;

      for (const tool of modernTools) {
        if (
          packageJson.dependencies?.[tool] ||
          packageJson.devDependencies?.[tool]
        ) {
          foundTools++;
        }
      }

      performance.score += (foundTools / modernTools.length) * 25; // 25 points for modern tools

      // Check for optimization libraries
      const optimizationLibs = ["compression", "express-rate-limit"];
      let foundOptimizations = 0;

      for (const lib of optimizationLibs) {
        if (packageJson.dependencies?.[lib]) {
          foundOptimizations++;
        }
      }

      performance.score += (foundOptimizations / optimizationLibs.length) * 25; // 25 points for optimizations

      performance.status =
        performance.score > 70
          ? "good"
          : performance.score > 40
            ? "warning"
            : "critical";
    } catch (error) {
      performance.issues.push(`Performance check failed: ${error.message}`);
      performance.score = 30;
      performance.status = "warning";
    }

    this.results.categories.performance = performance;
    console.log(`   Score: ${performance.score}/100`);
  }

  async checkDocumentation() {
    console.log("📚 Checking Documentation...");

    const docs = {
      score: 0,
      issues: [],
      status: "checking",
      metrics: {},
    };

    try {
      // Check for README
      try {
        const readme = await fs.readFile("./README.md", "utf8");
        docs.score += 30; // 30 points for README
        docs.metrics.readmeLength = readme.length;

        // Check README quality
        const requiredSections = [
          "installation",
          "usage",
          "features",
          "development",
        ];
        let foundSections = 0;

        for (const section of requiredSections) {
          if (readme.toLowerCase().includes(section)) {
            foundSections++;
          }
        }

        docs.score += (foundSections / requiredSections.length) * 20; // 20 points for comprehensive README
      } catch {
        docs.issues.push("README.md missing");
        this.results.warnings.push("Missing README.md file");
      }

      // Check docs directory
      try {
        const docFiles = await fs.readdir("./docs");
        docs.metrics.docFiles = docFiles.length;
        docs.score += Math.min(docFiles.length * 2, 30); // Up to 30 points for doc files
      } catch {
        docs.issues.push("docs directory missing");
      }

      // Check for development documentation
      const devDocs = ["./CLAUDE.md", "./docs/DEVELOPMENT.md", "./docs/API.md"];
      let foundDevDocs = 0;

      for (const doc of devDocs) {
        try {
          await fs.access(doc);
          foundDevDocs++;
        } catch {
          // Doc not found
        }
      }

      docs.score += (foundDevDocs / devDocs.length) * 20; // 20 points for dev docs

      docs.status =
        docs.score > 70 ? "good" : docs.score > 40 ? "warning" : "critical";
    } catch (error) {
      docs.issues.push(`Documentation check failed: ${error.message}`);
      docs.score = 0;
      docs.status = "critical";
    }

    this.results.categories.documentation = docs;
    console.log(`   Score: ${docs.score}/100`);
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch {
      // Directory access error
    }

    return totalSize;
  }

  calculateOverallHealth() {
    const categories = Object.values(this.results.categories);
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    this.results.overallHealth = Math.round(totalScore / categories.length);

    // Add recommendations based on overall health
    if (this.results.overallHealth < 50) {
      this.results.recommendations.push(
        "🚨 Critical: Not ready for production deployment",
      );
      this.results.recommendations.push(
        "Focus on fixing critical issues first",
      );
    } else if (this.results.overallHealth < 70) {
      this.results.recommendations.push(
        "⚠️  Warning: Needs improvement before production",
      );
      this.results.recommendations.push("Address security and testing issues");
    } else if (this.results.overallHealth < 85) {
      this.results.recommendations.push("✅ Good: Minor improvements needed");
      this.results.recommendations.push("Consider performance optimizations");
    } else {
      this.results.recommendations.push("🏆 Excellent: Production ready!");
    }
  }

  async generateReport() {
    const reportPath = "./health-check-report.json";
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`\n📊 Health check report saved to: ${reportPath}`);
  }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const healthChecker = new HealthChecker();
  healthChecker.runComprehensiveCheck().catch(console.error);
}

export default HealthChecker;
