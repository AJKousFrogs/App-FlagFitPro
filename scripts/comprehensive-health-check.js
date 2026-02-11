#!/usr/bin/env node

// Comprehensive Health Check Script for Production Readiness
// Validates all aspects of the Flag Football app before deployment

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getDirectorySize } from "./lib/file-utils.js";

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

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
      await this.checkDatabase();
      await this.checkAPIEndpoints();
      await this.checkEnvironment();

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
      } catch {
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
      } catch {
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
      const productionFiles = ["./angular/src/main.ts", "./index.html"];
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
        "./angular/angular.json",
        "./angular/src/main.ts",
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
        const nodeModulesSize = await getDirectorySize("./node_modules");
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

  async checkDatabase() {
    console.log("🗄️  Checking Database Connectivity...");

    const database = {
      score: 0,
      issues: [],
      status: "checking",
      metrics: {},
    };

    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        database.issues.push("Missing Supabase environment variables");
        database.status = "critical";
        this.results.criticalIssues.push(
          "Database: Missing SUPABASE_URL or SUPABASE_KEY",
        );
        this.results.categories.database = database;
        console.log(`   Score: ${database.score}/100`);
        return;
      }

      // Test database connection
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const startTime = Date.now();

        // Test query
        const {
          data: _data,
          error,
          count: _count,
        } = await supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .limit(1);

        const queryTime = Date.now() - startTime;
        database.metrics.queryTime = `${queryTime}ms`;

        if (error) {
          database.issues.push(`Database query failed: ${error.message}`);
          database.status = "critical";
          this.results.criticalIssues.push(`Database: ${error.message}`);
        } else {
          database.score += 50; // 50 points for successful connection
          database.metrics.connected = true;
          database.metrics.responseTime = queryTime;

          if (queryTime > 1000) {
            database.issues.push(`Slow database response: ${queryTime}ms`);
            this.results.warnings.push("Database response time is slow");
          }
        }

        // Check for critical tables
        const criticalTables = ["users", "teams", "training_sessions"];
        let tablesFound = 0;

        for (const table of criticalTables) {
          try {
            const { error: tableError } = await supabase
              .from(table)
              .select("id")
              .limit(1);

            if (!tableError) {
              tablesFound++;
            }
          } catch {
            // Table doesn't exist or not accessible
          }
        }

        database.score += (tablesFound / criticalTables.length) * 30; // 30 points for tables
        database.metrics.tablesFound = tablesFound;
        database.metrics.totalTables = criticalTables.length;

        if (tablesFound < criticalTables.length) {
          database.issues.push(
            `Missing critical tables: ${criticalTables.length - tablesFound}`,
          );
        }

        // Check database migrations
        try {
          const migrationsDir = "./database/migrations";
          const migrationFiles = await fs.readdir(migrationsDir);
          database.metrics.migrations = migrationFiles.length;
          database.score += Math.min(migrationFiles.length * 2, 20); // Up to 20 points for migrations
        } catch {
          database.issues.push("Cannot access migrations directory");
        }
      } catch (error) {
        database.issues.push(`Database connection failed: ${error.message}`);
        database.status = "critical";
        this.results.criticalIssues.push(
          `Database: Connection failed - ${error.message}`,
        );
      }

      database.status =
        database.score > 70
          ? "good"
          : database.score > 40
            ? "warning"
            : "critical";
    } catch (error) {
      database.issues.push(`Database check failed: ${error.message}`);
      database.score = 0;
      database.status = "critical";
    }

    this.results.categories.database = database;
    console.log(`   Score: ${database.score}/100`);
  }

  async checkAPIEndpoints() {
    console.log("🌐 Checking API Endpoints...");

    const api = {
      score: 0,
      issues: [],
      status: "checking",
      metrics: {},
    };

    try {
      // Check Netlify functions exist
      const functionsDir = "./netlify/functions";
      let functionsFound = 0;
      let totalFunctions = 0;

      try {
        const functionFiles = await fs.readdir(functionsDir);
        totalFunctions = functionFiles.filter(
          (f) => f.endsWith(".cjs") || f.endsWith(".js"),
        ).length;
        functionsFound = totalFunctions;

        api.metrics.functionsFound = functionsFound;
        api.score += Math.min(functionsFound * 2, 40); // Up to 40 points for functions

        // Check for critical functions
        const criticalFunctions = [
          "auth-me.js",
          "dashboard.js",
          "auth-login.js",
        ];
        let criticalFound = 0;

        for (const func of criticalFunctions) {
          try {
            await fs.access(path.join(functionsDir, func));
            criticalFound++;
          } catch {
            api.issues.push(`Missing critical function: ${func}`);
          }
        }

        api.score += (criticalFound / criticalFunctions.length) * 30; // 30 points for critical functions
        api.metrics.criticalFunctions = criticalFound;
      } catch {
        api.issues.push("Cannot access Netlify functions directory");
      }

      // Check error handler utility exists
      try {
        await fs.access("./netlify/functions/utils/error-handler.js");
        api.score += 15; // 15 points for error handler
      } catch {
        api.issues.push("Missing error handler utility");
      }

      // Check for API documentation
      try {
        const apiDocs = await fs.readFile("./docs/API.md", "utf8");
        if (apiDocs.length > 1000) {
          api.score += 15; // 15 points for API docs
        }
      } catch {
        api.issues.push("API documentation missing or incomplete");
      }

      api.status =
        api.score > 70 ? "good" : api.score > 40 ? "warning" : "critical";
    } catch (error) {
      api.issues.push(`API check failed: ${error.message}`);
      api.score = 0;
      api.status = "critical";
    }

    this.results.categories.api = api;
    console.log(`   Score: ${api.score}/100`);
  }

  async checkEnvironment() {
    console.log("🔧 Checking Environment Configuration...");

    const env = {
      score: 0,
      issues: [],
      status: "checking",
      metrics: {},
    };

    try {
      // Required environment variables
      const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];

      // Optional but recommended
      const recommendedVars = [
        "SUPABASE_SERVICE_KEY",
        "JWT_SECRET",
        "NODE_ENV",
      ];

      let foundRequired = 0;
      let foundRecommended = 0;

      for (const varName of requiredVars) {
        if (process.env[varName]) {
          foundRequired++;
        } else {
          env.issues.push(`Missing required environment variable: ${varName}`);
          this.results.criticalIssues.push(`Environment: Missing ${varName}`);
        }
      }

      for (const varName of recommendedVars) {
        if (process.env[varName]) {
          foundRecommended++;
        } else {
          env.issues.push(
            `Missing recommended environment variable: ${varName}`,
          );
        }
      }

      env.score += (foundRequired / requiredVars.length) * 60; // 60 points for required vars
      env.score += (foundRecommended / recommendedVars.length) * 30; // 30 points for recommended vars

      // Check .env.example exists
      try {
        await fs.access("./.env.example");
        env.score += 10; // 10 points for .env.example
      } catch {
        env.issues.push("Missing .env.example file");
      }

      env.metrics.requiredVars = foundRequired;
      env.metrics.totalRequired = requiredVars.length;
      env.metrics.recommendedVars = foundRecommended;
      env.metrics.totalRecommended = recommendedVars.length;

      env.status =
        env.score > 70 ? "good" : env.score > 40 ? "warning" : "critical";
    } catch (error) {
      env.issues.push(`Environment check failed: ${error.message}`);
      env.score = 0;
      env.status = "critical";
    }

    this.results.categories.environment = env;
    console.log(`   Score: ${env.score}/100`);
  }

  async generateReport() {
    const reportPath = "./health-check-report.json";
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile("./HEALTH_CHECK_REPORT.md", markdownReport);

    console.log(`\n📊 Health check reports saved:`);
    console.log(`   - JSON: ${reportPath}`);
    console.log(`   - Markdown: ./HEALTH_CHECK_REPORT.md`);
  }

  generateMarkdownReport() {
    let report = `# Comprehensive Health Check Report\n\n`;
    report += `**Generated:** ${this.results.timestamp}\n`;
    report += `**Overall Health:** ${this.results.overallHealth}/100\n\n`;

    // Health status badge
    let statusBadge = "🔴 Critical";
    if (this.results.overallHealth >= 85) {
      statusBadge = "🟢 Excellent";
    } else if (this.results.overallHealth >= 70) {
      statusBadge = "🟡 Good";
    } else if (this.results.overallHealth >= 50) {
      statusBadge = "🟠 Warning";
    }

    report += `**Status:** ${statusBadge}\n\n`;

    // Categories
    report += `## Categories\n\n`;
    Object.entries(this.results.categories).forEach(([category, data]) => {
      const statusIcon =
        data.status === "good" ? "✅" : data.status === "warning" ? "⚠️" : "❌";
      report += `### ${statusIcon} ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      report += `**Score:** ${data.score}/100\n\n`;

      if (data.metrics && Object.keys(data.metrics).length > 0) {
        report += `**Metrics:**\n`;
        Object.entries(data.metrics).forEach(([key, value]) => {
          report += `- ${key}: ${value}\n`;
        });
        report += `\n`;
      }

      if (data.issues && data.issues.length > 0) {
        report += `**Issues:**\n`;
        data.issues.forEach((issue) => {
          report += `- ${issue}\n`;
        });
        report += `\n`;
      }
    });

    // Critical Issues
    if (this.results.criticalIssues.length > 0) {
      report += `## 🚨 Critical Issues\n\n`;
      this.results.criticalIssues.forEach((issue) => {
        report += `- ❌ ${issue}\n`;
      });
      report += `\n`;
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      report += `## ⚠️  Warnings\n\n`;
      this.results.warnings.forEach((warning) => {
        report += `- ⚠️  ${warning}\n`;
      });
      report += `\n`;
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      report += `## 💡 Recommendations\n\n`;
      this.results.recommendations.forEach((rec) => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const healthChecker = new HealthChecker();
  healthChecker.runComprehensiveCheck().catch(console.error);
}

export default HealthChecker;
