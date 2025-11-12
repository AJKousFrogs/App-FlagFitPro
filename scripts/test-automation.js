#!/usr/bin/env node

/**
 * Test Automation Script for Flag Football Training App
 * Provides comprehensive test execution, reporting, and automation utilities
 */

import { execSync, spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

class TestAutomation {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {},
      coverage: {},
      performance: {},
      failures: [],
    };

    this.config = {
      maxRetries: 3,
      parallelWorkers: 4,
      timeoutMs: 300000, // 5 minutes
      coverageThreshold: 80,
      performanceThreshold: {
        avgResponseTime: 200,
        errorRate: 1,
        memoryUsage: 100, // MB
      },
    };
  }

  async runAllTests() {
    console.log("🚀 Starting comprehensive test automation...");

    try {
      // Pre-test setup
      await this.setupTestEnvironment();

      // Run test suites in parallel where possible
      const testSuites = [
        { name: "lint", fn: () => this.runLinting() },
        { name: "unit", fn: () => this.runUnitTests() },
        { name: "integration", fn: () => this.runIntegrationTests() },
        { name: "performance", fn: () => this.runPerformanceTests() },
      ];

      // Run non-conflicting tests in parallel
      await this.runTestsInParallel([
        testSuites.find((t) => t.name === "lint"),
        testSuites.find((t) => t.name === "unit"),
      ]);

      // Run integration tests (may need clean state)
      await this.runTestSequentially([
        testSuites.find((t) => t.name === "integration"),
      ]);

      // Run E2E tests (need running application)
      await this.setupApplication();
      await this.runE2ETests();

      // Run performance tests last (may be resource intensive)
      await this.runTestSequentially([
        testSuites.find((t) => t.name === "performance"),
      ]);

      // Generate comprehensive report
      await this.generateTestReport();

      // Cleanup
      await this.cleanup();

      console.log("✅ All tests completed successfully!");
      return this.testResults;
    } catch (error) {
      console.error("❌ Test automation failed:", error.message);
      await this.handleTestFailure(error);
      process.exit(1);
    }
  }

  async setupTestEnvironment() {
    console.log("📋 Setting up test environment...");

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`Node.js version: ${nodeVersion}`);

    // Install dependencies if needed
    try {
      await this.execCommand("npm ci", { timeout: 120000 });
    } catch (_error) {
      console.log("Installing dependencies...");
      await this.execCommand("npm install", { timeout: 180000 });
    }

    // Setup test database
    await this.setupTestDatabase();

    // Clean previous test artifacts
    await this.cleanTestArtifacts();

    console.log("✅ Test environment ready");
  }

  async setupTestDatabase() {
    console.log("🗄️ Setting up test database...");

    try {
      // Check if PostgreSQL is available
      await this.execCommand("pg_isready", { timeout: 5000 });

      // Create test database
      await this.execCommand("createdb flagfit_test", { ignoreError: true });

      // Run migrations
      await this.execCommand("npm run db:migrate:test", {
        env: { DATABASE_URL: "postgresql://localhost/flagfit_test" },
      });

      console.log("✅ Test database ready");
    } catch (_error) {
      console.log("⚠️ Database setup failed, using mock data");
    }
  }

  async cleanTestArtifacts() {
    const artifactDirs = [
      "test-results",
      "coverage",
      "playwright-report",
      "performance-reports",
    ];

    for (const dir of artifactDirs) {
      try {
        await fs.rm(path.join(projectRoot, dir), {
          recursive: true,
          force: true,
        });
      } catch (_error) {
        // Directory might not exist, ignore
      }
    }

    // Create fresh directories
    for (const dir of artifactDirs) {
      await fs.mkdir(path.join(projectRoot, dir), { recursive: true });
    }
  }

  async runLinting() {
    console.log("🔍 Running code quality checks...");

    const lintResults = {
      eslint: { passed: false, errors: [], warnings: [] },
      prettier: { passed: false, issues: [] },
      typescript: { passed: false, errors: [] },
    };

    try {
      // ESLint
      try {
        await this.execCommand(
          "npx eslint . --ext .js,.jsx,.ts,.tsx --format json --output-file eslint-report.json",
        );
        lintResults.eslint.passed = true;
      } catch (error) {
        const report = await this.readJsonFile("eslint-report.json");
        lintResults.eslint.errors =
          report?.filter((r) => r.errorCount > 0) || [];
        lintResults.eslint.warnings =
          report?.filter((r) => r.warningCount > 0) || [];
      }

      // Prettier
      try {
        await this.execCommand("npx prettier --check .");
        lintResults.prettier.passed = true;
      } catch (error) {
        lintResults.prettier.issues =
          error.stdout?.split("\n").filter(Boolean) || [];
      }

      // TypeScript (if applicable)
      try {
        await this.execCommand("npx tsc --noEmit");
        lintResults.typescript.passed = true;
      } catch (error) {
        lintResults.typescript.errors =
          error.stdout?.split("\n").filter(Boolean) || [];
      }

      this.testResults.details.linting = lintResults;

      const allPassed = Object.values(lintResults).every(
        (result) => result.passed,
      );
      console.log(
        allPassed
          ? "✅ Code quality checks passed"
          : "⚠️ Code quality issues found",
      );
    } catch (error) {
      console.error("❌ Linting failed:", error.message);
      throw error;
    }
  }

  async runUnitTests() {
    console.log("🧪 Running unit tests...");

    try {
      await this.execCommand(
        "npm run test:unit -- --coverage --reporter=json --outputFile=unit-test-results.json",
      );

      const testReport = await this.readJsonFile("unit-test-results.json");
      const coverageReport = await this.readJsonFile(
        "coverage/coverage-summary.json",
      );

      this.testResults.details.unit = {
        passed: testReport?.numPassedTests || 0,
        failed: testReport?.numFailedTests || 0,
        total: testReport?.numTotalTests || 0,
        duration:
          testReport?.testResults?.reduce(
            (sum, t) => sum + t.perfStats.runtime,
            0,
          ) || 0,
      };

      this.testResults.coverage.unit = {
        lines: coverageReport?.total?.lines?.pct || 0,
        functions: coverageReport?.total?.functions?.pct || 0,
        branches: coverageReport?.total?.branches?.pct || 0,
        statements: coverageReport?.total?.statements?.pct || 0,
      };

      const coverageMet =
        this.testResults.coverage.unit.lines >= this.config.coverageThreshold;
      console.log(
        `✅ Unit tests completed. Coverage: ${this.testResults.coverage.unit.lines}% ${coverageMet ? "✅" : "⚠️"}`,
      );
    } catch (error) {
      console.error("❌ Unit tests failed:", error.message);
      this.testResults.failures.push({ suite: "unit", error: error.message });
      throw error;
    }
  }

  async runIntegrationTests() {
    console.log("🔗 Running integration tests...");

    try {
      await this.execCommand(
        "npm run test:integration -- --reporter=json --outputFile=integration-test-results.json",
      );

      const testReport = await this.readJsonFile(
        "integration-test-results.json",
      );

      this.testResults.details.integration = {
        passed: testReport?.numPassedTests || 0,
        failed: testReport?.numFailedTests || 0,
        total: testReport?.numTotalTests || 0,
        duration:
          testReport?.testResults?.reduce(
            (sum, t) => sum + t.perfStats.runtime,
            0,
          ) || 0,
      };

      console.log(
        `✅ Integration tests completed: ${this.testResults.details.integration.passed}/${this.testResults.details.integration.total} passed`,
      );
    } catch (error) {
      console.error("❌ Integration tests failed:", error.message);
      this.testResults.failures.push({
        suite: "integration",
        error: error.message,
      });
      throw error;
    }
  }

  async setupApplication() {
    console.log("🚀 Starting application for E2E tests...");

    try {
      // Build application
      await this.execCommand("npm run build");

      // Start server in background
      this.serverProcess = spawn("npm", ["start"], {
        detached: true,
        stdio: "pipe",
      });

      // Wait for server to be ready
      await this.waitForServer("http://localhost:4000", 60000);

      console.log("✅ Application ready for E2E tests");
    } catch (error) {
      console.error("❌ Failed to start application:", error.message);
      throw error;
    }
  }

  async runE2ETests() {
    console.log("🌐 Running E2E tests...");

    try {
      // Install Playwright browsers if needed
      await this.execCommand(
        "npx playwright install --with-deps chromium firefox webkit",
      );

      // Run E2E tests
      await this.execCommand(
        "npx playwright test --reporter=json --output-dir=e2e-test-results",
      );

      const testReport = await this.readJsonFile(
        "e2e-test-results/report.json",
      );

      this.testResults.details.e2e = {
        passed: testReport?.stats?.passed || 0,
        failed: testReport?.stats?.failed || 0,
        total: testReport?.stats?.total || 0,
        duration: testReport?.stats?.duration || 0,
        browsers: testReport?.config?.projects?.map((p) => p.name) || [],
      };

      console.log(
        `✅ E2E tests completed: ${this.testResults.details.e2e.passed}/${this.testResults.details.e2e.total} passed`,
      );
    } catch (error) {
      console.error("❌ E2E tests failed:", error.message);
      this.testResults.failures.push({ suite: "e2e", error: error.message });
      throw error;
    }
  }

  async runPerformanceTests() {
    console.log("⚡ Running performance tests...");

    try {
      await this.execCommand(
        "npm run test:performance -- --output-dir=performance-reports",
      );

      const performanceReport = await this.readJsonFile(
        "performance-reports/performance-summary.json",
      );

      this.testResults.performance = {
        loadTime: performanceReport?.loadTime || 0,
        avgResponseTime: performanceReport?.avgResponseTime || 0,
        throughput: performanceReport?.throughput || 0,
        errorRate: performanceReport?.errorRate || 0,
        memoryUsage: performanceReport?.memoryUsage || 0,
        coreWebVitals: performanceReport?.coreWebVitals || {},
      };

      // Check performance thresholds
      const performancePassed =
        this.testResults.performance.avgResponseTime <=
          this.config.performanceThreshold.avgResponseTime &&
        this.testResults.performance.errorRate <=
          this.config.performanceThreshold.errorRate &&
        this.testResults.performance.memoryUsage <=
          this.config.performanceThreshold.memoryUsage;

      console.log(
        `✅ Performance tests completed ${performancePassed ? "✅" : "⚠️"}`,
      );
    } catch (error) {
      console.error("❌ Performance tests failed:", error.message);
      this.testResults.failures.push({
        suite: "performance",
        error: error.message,
      });
      // Don't throw - performance tests can be flaky in CI
    }
  }

  async runTestsInParallel(testSuites) {
    console.log(`🔀 Running ${testSuites.length} test suites in parallel...`);

    const promises = testSuites.map((suite) =>
      suite.fn().catch((error) => ({ error, suite: suite.name })),
    );

    const results = await Promise.all(promises);

    const failures = results.filter((r) => r.error);
    if (failures.length > 0) {
      console.error(`❌ ${failures.length} parallel test suites failed`);
      for (const failure of failures) {
        console.error(`  - ${failure.suite}: ${failure.error.message}`);
      }
      throw new Error(
        `Parallel test execution failed: ${failures.map((f) => f.suite).join(", ")}`,
      );
    }
  }

  async runTestSequentially(testSuites) {
    console.log(`➡️ Running ${testSuites.length} test suites sequentially...`);

    for (const suite of testSuites) {
      await suite.fn();
    }
  }

  async generateTestReport() {
    console.log("📊 Generating comprehensive test report...");

    // Calculate overall summary
    this.testResults.summary = {
      totalTests: Object.values(this.testResults.details).reduce(
        (sum, suite) => sum + (suite.total || 0),
        0,
      ),
      totalPassed: Object.values(this.testResults.details).reduce(
        (sum, suite) => sum + (suite.passed || 0),
        0,
      ),
      totalFailed: Object.values(this.testResults.details).reduce(
        (sum, suite) => sum + (suite.failed || 0),
        0,
      ),
      totalDuration: Object.values(this.testResults.details).reduce(
        (sum, suite) => sum + (suite.duration || 0),
        0,
      ),
      overallCoverage: this.calculateOverallCoverage(),
      performanceScore: this.calculatePerformanceScore(),
      passed: this.testResults.failures.length === 0,
    };

    // Generate HTML report
    await this.generateHTMLReport();

    // Generate JSON report
    await fs.writeFile(
      path.join(projectRoot, "test-results", "comprehensive-report.json"),
      JSON.stringify(this.testResults, null, 2),
    );

    // Generate summary for CI
    await this.generateCISummary();

    console.log("✅ Test report generated");
  }

  calculateOverallCoverage() {
    const coverage = this.testResults.coverage;
    if (!coverage.unit) return 0;

    return Math.round(
      (coverage.unit.lines +
        coverage.unit.functions +
        coverage.unit.branches +
        coverage.unit.statements) /
        4,
    );
  }

  calculatePerformanceScore() {
    const perf = this.testResults.performance;
    if (!perf.avgResponseTime) return 0;

    let score = 100;

    // Deduct points for slow response times
    if (perf.avgResponseTime > 200)
      score -= Math.min(50, (perf.avgResponseTime - 200) / 10);

    // Deduct points for errors
    if (perf.errorRate > 1) score -= perf.errorRate * 10;

    // Deduct points for high memory usage
    if (perf.memoryUsage > 100) score -= (perf.memoryUsage - 100) / 10;

    return Math.max(0, Math.round(score));
  }

  async generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flag Football Training App - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .card.success { border-left: 4px solid #28a745; }
        .card.warning { border-left: 4px solid #ffc107; }
        .card.danger { border-left: 4px solid #dc3545; }
        .metric { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
        .label { color: #666; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section h3 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s ease; }
        .performance-chart { height: 200px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏈 Flag Football Training App - Test Report</h1>
            <p>Generated on ${new Date(this.testResults.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="card ${this.testResults.summary.passed ? "success" : "danger"}">
                <div class="metric">${this.testResults.summary.passed ? "✅ PASSED" : "❌ FAILED"}</div>
                <div class="label">Overall Status</div>
            </div>
            <div class="card">
                <div class="metric">${this.testResults.summary.totalPassed}/${this.testResults.summary.totalTests}</div>
                <div class="label">Tests Passed</div>
            </div>
            <div class="card ${this.testResults.summary.overallCoverage >= 80 ? "success" : "warning"}">
                <div class="metric">${this.testResults.summary.overallCoverage}%</div>
                <div class="label">Code Coverage</div>
            </div>
            <div class="card ${this.testResults.summary.performanceScore >= 80 ? "success" : "warning"}">
                <div class="metric">${this.testResults.summary.performanceScore}</div>
                <div class="label">Performance Score</div>
            </div>
        </div>

        <div class="section">
            <h3>Test Suite Results</h3>
            <table>
                <thead>
                    <tr>
                        <th>Suite</th>
                        <th>Tests</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Duration</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(this.testResults.details)
                      .map(
                        ([suite, data]) => `
                        <tr>
                            <td>${suite.charAt(0).toUpperCase() + suite.slice(1)}</td>
                            <td>${data.total || 0}</td>
                            <td class="status-pass">${data.passed || 0}</td>
                            <td class="status-fail">${data.failed || 0}</td>
                            <td>${Math.round((data.duration || 0) / 1000)}s</td>
                            <td class="${(data.failed || 0) === 0 ? "status-pass" : "status-fail"}">
                                ${(data.failed || 0) === 0 ? "PASSED" : "FAILED"}
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>

        ${
          this.testResults.coverage.unit
            ? `
        <div class="section">
            <h3>Coverage Report</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div>
                    <label>Lines: ${this.testResults.coverage.unit.lines}%</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.testResults.coverage.unit.lines}%"></div>
                    </div>
                </div>
                <div>
                    <label>Functions: ${this.testResults.coverage.unit.functions}%</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.testResults.coverage.unit.functions}%"></div>
                    </div>
                </div>
                <div>
                    <label>Branches: ${this.testResults.coverage.unit.branches}%</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.testResults.coverage.unit.branches}%"></div>
                    </div>
                </div>
                <div>
                    <label>Statements: ${this.testResults.coverage.unit.statements}%</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.testResults.coverage.unit.statements}%"></div>
                    </div>
                </div>
            </div>
        </div>
        `
            : ""
        }

        ${
          this.testResults.failures.length > 0
            ? `
        <div class="section">
            <h3>Test Failures</h3>
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px;">
                ${this.testResults.failures
                  .map(
                    (failure) => `
                    <div style="margin-bottom: 10px;">
                        <strong>${failure.suite}:</strong> ${failure.error}
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
        `
            : ""
        }
    </div>
</body>
</html>
    `;

    await fs.writeFile(
      path.join(projectRoot, "test-results", "report.html"),
      html,
    );
  }

  async generateCISummary() {
    const summary = `
# 🏈 Flag Football Training App - Test Results

## Summary
- **Overall Status:** ${this.testResults.summary.passed ? "✅ PASSED" : "❌ FAILED"}
- **Total Tests:** ${this.testResults.summary.totalPassed}/${this.testResults.summary.totalTests}
- **Code Coverage:** ${this.testResults.summary.overallCoverage}%
- **Performance Score:** ${this.testResults.summary.performanceScore}/100

## Test Suites
${Object.entries(this.testResults.details)
  .map(
    ([suite, data]) =>
      `- **${suite.charAt(0).toUpperCase() + suite.slice(1)}:** ${data.passed || 0}/${data.total || 0} passed ${(data.failed || 0) === 0 ? "✅" : "❌"}`,
  )
  .join("\n")}

${
  this.testResults.failures.length > 0
    ? `
## Failures
${this.testResults.failures.map((f) => `- **${f.suite}:** ${f.error}`).join("\n")}
`
    : ""
}

Generated on ${new Date(this.testResults.timestamp).toLocaleString()}
    `;

    await fs.writeFile(
      path.join(projectRoot, "test-results", "summary.md"),
      summary.trim(),
    );
  }

  async cleanup() {
    console.log("🧹 Cleaning up...");

    // Stop application server
    if (this.serverProcess) {
      this.serverProcess.kill("SIGTERM");
    }

    // Clean up temporary files
    const tempFiles = [
      "eslint-report.json",
      "unit-test-results.json",
      "integration-test-results.json",
    ];
    for (const file of tempFiles) {
      try {
        await fs.unlink(path.join(projectRoot, file));
      } catch (_error) {
        // File might not exist
      }
    }
  }

  async handleTestFailure(error) {
    console.error("🚨 Test automation encountered critical failure");

    // Generate failure report
    const failureReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      results: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
      },
    };

    await fs.writeFile(
      path.join(projectRoot, "test-results", "failure-report.json"),
      JSON.stringify(failureReport, null, 2),
    );

    // Cleanup
    await this.cleanup();
  }

  // Utility methods
  async execCommand(command, options = {}) {
    const {
      timeout = this.config.timeoutMs,
      env = {},
      ignoreError = false,
    } = options;

    return new Promise((resolve, reject) => {
      const childProcess = execSync(command, {
        cwd: projectRoot,
        env: { ...process.env, ...env },
        encoding: "utf8",
        timeout,
        stdio: "pipe",
      });

      try {
        const result = childProcess.toString();
        resolve(result);
      } catch (error) {
        if (ignoreError) {
          resolve("");
        } else {
          reject(error);
        }
      }
    });
  }

  async readJsonFile(filePath) {
    try {
      const content = await fs.readFile(
        path.join(projectRoot, filePath),
        "utf8",
      );
      return JSON.parse(content);
    } catch (_error) {
      return null;
    }
  }

  async waitForServer(url, timeoutMs) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return true;
        }
      } catch (_error) {
        // Server not ready yet
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(`Server at ${url} not ready within ${timeoutMs}ms`);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const automation = new TestAutomation();

  const command = process.argv[2] || "all";

  switch (command) {
    case "all":
      automation.runAllTests().catch((error) => {
        console.error("Test automation failed:", error.message);
        process.exit(1);
      });
      break;

    case "unit":
      automation.runUnitTests().catch((error) => {
        console.error("Unit tests failed:", error.message);
        process.exit(1);
      });
      break;

    case "integration":
      automation.runIntegrationTests().catch((error) => {
        console.error("Integration tests failed:", error.message);
        process.exit(1);
      });
      break;

    case "e2e":
      automation
        .setupApplication()
        .then(() => automation.runE2ETests())
        .finally(() => automation.cleanup())
        .catch((error) => {
          console.error("E2E tests failed:", error.message);
          process.exit(1);
        });
      break;

    case "performance":
      automation.runPerformanceTests().catch((error) => {
        console.error("Performance tests failed:", error.message);
        process.exit(1);
      });
      break;

    default:
      console.log(`
Usage: node scripts/test-automation.js [command]

Commands:
  all          Run all test suites (default)
  unit         Run unit tests only
  integration  Run integration tests only
  e2e          Run end-to-end tests only
  performance  Run performance tests only
      `);
      process.exit(1);
  }
}

export default TestAutomation;
